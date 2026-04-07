from sqlalchemy import select
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from database import ClassSession, Professor, SessionLocal


def check_workload(professor_name: str, class_session_ids: list[int]) -> bool:
    """
    Validate whether assigning the proposed class sessions keeps a professor
    within their maximum allowed workload.

    Returns:
        False if professor is missing, any class_session_id is invalid,
        or total workload exceeds max_hours.
        True if total workload is <= max_hours.
    """
    with SessionLocal() as session:
        professor = session.execute(
            select(Professor).where(Professor.name == professor_name)
        ).scalar_one_or_none()

        if professor is None:
            return False

        if not class_session_ids:
            proposed_hours = 0
        else:
            unique_ids = list(dict.fromkeys(class_session_ids))
            sessions = session.execute(
                select(ClassSession.id, ClassSession.required_hours).where(
                    ClassSession.id.in_(unique_ids)
                )
            ).all()

            # Strict validation: all proposed IDs must exist.
            if len(sessions) != len(unique_ids):
                return False

            proposed_hours = sum(row.required_hours for row in sessions)

        total_hours = professor.current_hours + proposed_hours
        return total_hours <= professor.max_hours


class CheckWorkloadInput(BaseModel):
    professor_name: str = Field(..., description="Professor full name")
    class_session_ids: list[int] = Field(
        ..., description="List of proposed ClassSession IDs"
    )


class CheckWorkloadTool(BaseTool):
    name: str = "CheckWorkloadTool"
    description: str = (
        "Validate whether assigning class session IDs keeps a professor at or below "
        "their max workload. Returns true/false."
    )
    args_schema: type[BaseModel] = CheckWorkloadInput

    def _run(self, professor_name: str, class_session_ids: list[int]) -> bool:
        return check_workload(
            professor_name=professor_name, class_session_ids=class_session_ids
        )
