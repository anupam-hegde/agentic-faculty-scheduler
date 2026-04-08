import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from sqlalchemy import select

from database import ClassSession, Professor, SessionLocal

app = FastAPI(title="Project APAN API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class NegotiateRequest(BaseModel):
    nvidia_api_key: str | None = None
    custom_backstories: dict[str, str] | None = None


@app.post("/api/negotiate")
def negotiate_timetable(
    request: Request, payload: NegotiateRequest | None = None
) -> dict:
    try:
        body_key = (
            payload.nvidia_api_key.strip() if payload and payload.nvidia_api_key else ""
        )
        header_key = request.headers.get("X-NVIDIA-API-Key", "").strip()

        if body_key:
            os.environ["NVIDIA_API_KEY"] = body_key
            os.environ["NVIDIA_NIM_API_KEY"] = body_key
        elif header_key:
            os.environ["NVIDIA_API_KEY"] = header_key
            os.environ["NVIDIA_NIM_API_KEY"] = header_key

        if not os.environ.get("NVIDIA_API_KEY"):
            raise HTTPException(
                status_code=400,
                detail="Missing NVIDIA API key. Pass it in request body as nvidia_api_key or X-NVIDIA-API-Key header.",
            )

        with SessionLocal() as session:
            for class_session in session.scalars(select(ClassSession)).all():
                class_session.assigned_to_id = None
            session.commit()

        from agent_engine import run_allocation_process

        allocation = run_allocation_process(
            custom_backstories=payload.custom_backstories if payload else None
        )

        with SessionLocal() as session:
            for professor_name, session_ids in allocation.items():
                professor = session.execute(
                    select(Professor).where(Professor.name == professor_name)
                ).scalar_one_or_none()

                if not professor:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Professor '{professor_name}' not found.",
                    )

                if not session_ids:
                    continue

                assigned_sessions = (
                    session.execute(
                        select(ClassSession).where(ClassSession.id.in_(session_ids))
                    )
                    .scalars()
                    .all()
                )

                for class_session in assigned_sessions:
                    class_session.assigned_to_id = professor.id

            session.commit()

        return {"timetable": allocation}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/status")
def get_status() -> dict:
    with SessionLocal() as session:
        rows = (
            session.execute(
                select(ClassSession)
                .where(ClassSession.assigned_to_id.is_(None))
                .order_by(ClassSession.id)
            )
            .scalars()
            .all()
        )

    unassigned_subjects = [
        {
            "id": row.id,
            "subject_name": row.subject_name,
            "year": row.year,
            "section": row.section,
            "required_hours": row.required_hours,
        }
        for row in rows
    ]

    return {"unassigned_subjects": unassigned_subjects}


@app.get("/api/timetable")
def get_timetable() -> list[dict]:
    with SessionLocal() as session:
        rows = session.execute(
            select(ClassSession, Professor)
            .join(Professor, ClassSession.assigned_to_id == Professor.id)
            .order_by(ClassSession.id)
        ).all()

    return [
        {
            "session_id": class_session.id,
            "subject_name": class_session.subject_name,
            "year": class_session.year,
            "section": class_session.section,
            "professor_name": professor.name,
        }
        for class_session, professor in rows
    ]


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
