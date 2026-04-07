import json
import os
import re
from typing import Any

from crewai import Agent, Crew, Process, Task
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from sqlalchemy import select

from database import ClassSession, SessionLocal
from validator import CheckWorkloadTool

llm = ChatNVIDIA(
    model="meta/llama3-70b-instruct",
    api_key=os.environ["NVIDIA_API_KEY"],
)

# CrewAI agents in this setup use a model identifier string.
llm_for_agents = "nvidia_nim/meta/llama3-70b-instruct"

check_workload_tool = CheckWorkloadTool()

sharma_agent = Agent(
    role="Sharma Allocation Negotiator",
    goal="Secure the most suitable timetable for Dr. Sharma while respecting workload limits.",
    backstory="You represent Dr. Sharma. Your absolute goal is to secure Year 3 Machine Learning (Sections A and B). You refuse Year 1 classes. You negotiate aggressively.",
    llm=llm_for_agents,
    tools=[check_workload_tool],
    verbose=False,
)

verma_agent = Agent(
    role="Verma Allocation Negotiator",
    goal="Secure the most suitable timetable for Dr. Verma while respecting workload limits.",
    backstory="You represent Dr. Verma. Your goal is Year 2 Data Structures. You prefer Section A, but will take both to meet your minimum hours. You use logical trade-offs.",
    llm=llm_for_agents,
    tools=[check_workload_tool],
    verbose=False,
)

rao_agent = Agent(
    role="Rao Allocation Negotiator",
    goal="Secure the most suitable timetable for Dr. Rao while respecting workload limits.",
    backstory="You represent Dr. Rao. Your goal is Year 1 classes. You are highly cooperative and will take leftover sections, as long as the workload is valid.",
    llm=llm_for_agents,
    tools=[check_workload_tool],
    verbose=False,
)

negotiate_timetable = Task(
    description="Review all unassigned ClassSessions in the database. Debate with the other agents to claim classes based on your goals. Use the CheckWorkloadTool to ensure no one exceeds 16 hours. You must output the final agreement as a raw, valid JSON string mapping Professor Names to a list of ClassSession IDs (e.g., {'Dr. Sharma': [5, 6]}).\nUnassigned ClassSessions: {unassigned_sessions}",
    expected_output=(
        "A raw JSON string only, with no markdown, in the form "
        '{"Dr. Sharma": [5, 6], "Dr. Verma": [3, 4], "Dr. Rao": [1, 2]}.'
    ),
    agent=sharma_agent,
)

allocation_crew = Crew(
    agents=[sharma_agent, verma_agent, rao_agent],
    tasks=[negotiate_timetable],
    process=Process.sequential,
    verbose=False,
)


def _get_unassigned_sessions() -> list[dict[str, Any]]:
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

    return [
        {
            "id": row.id,
            "subject_name": row.subject_name,
            "year": row.year,
            "section": row.section,
            "required_hours": row.required_hours,
        }
        for row in rows
    ]


def _extract_json_text(output_text: str) -> str:
    text = output_text.strip()

    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\\s*", "", text)
        text = re.sub(r"\\s*```$", "", text)

    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("Crew output does not contain valid JSON.")
        candidate = text[start : end + 1]
        json.loads(candidate)
        return candidate


def _validate_allocation(payload: Any) -> dict[str, list[int]]:
    if not isinstance(payload, dict):
        raise ValueError("Allocation output must be a JSON object.")

    validated: dict[str, list[int]] = {}
    for professor_name, session_ids in payload.items():
        if not isinstance(professor_name, str):
            raise ValueError("Professor names must be strings.")
        if not isinstance(session_ids, list) or not all(
            isinstance(session_id, int) for session_id in session_ids
        ):
            raise ValueError(
                "Each professor must map to a list of integer ClassSession IDs."
            )
        validated[professor_name] = session_ids

    return validated


def run_allocation_process() -> dict[str, list[int]]:
    unassigned_sessions = _get_unassigned_sessions()
    result = allocation_crew.kickoff(
        inputs={"unassigned_sessions": unassigned_sessions}
    )

    raw_output = result.raw if hasattr(result, "raw") else str(result)
    json_text = _extract_json_text(raw_output)
    parsed = json.loads(json_text)
    return _validate_allocation(parsed)


if __name__ == "__main__":
    print(run_allocation_process())
