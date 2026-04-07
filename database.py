from sqlalchemy import Column, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = "sqlite:///timetable.db"

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

Base = declarative_base()


class Professor(Base):
    __tablename__ = "professors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    max_hours = Column(Integer, default=16, nullable=False)
    current_hours = Column(Integer, default=0, nullable=False)

    class_sessions = relationship("ClassSession", back_populates="assigned_to")


class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    subject_name = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    section = Column(String, nullable=False)
    required_hours = Column(Integer, default=4, nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("professors.id"), nullable=True)

    assigned_to = relationship("Professor", back_populates="class_sessions")


def setup_database() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        professors = [
            Professor(name="Dr. Sharma"),
            Professor(name="Dr. Verma"),
            Professor(name="Dr. Rao"),
        ]

        class_sessions = [
            ClassSession(
                subject_name="Intro to Python", year=1, section="A", required_hours=4
            ),
            ClassSession(
                subject_name="Intro to Python", year=1, section="B", required_hours=4
            ),
            ClassSession(
                subject_name="Data Structures", year=2, section="A", required_hours=4
            ),
            ClassSession(
                subject_name="Data Structures", year=2, section="B", required_hours=4
            ),
            ClassSession(
                subject_name="Machine Learning", year=3, section="A", required_hours=4
            ),
            ClassSession(
                subject_name="Machine Learning", year=3, section="B", required_hours=4
            ),
        ]

        session.add_all(professors)
        session.add_all(class_sessions)
        session.commit()


if __name__ == "__main__":
    setup_database()
    print("Database setup complete: timetable.db")
