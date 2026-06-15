from sqlmodel import Session, select
from app.models import Course
from app.core.db import engine
from app.services.vns.parser import get_courses



def sync_courses_from_vns():

    courses = get_courses()

    with Session(engine) as session:

        for course in courses:

            vns_id = (
                course["url"]
                .split("id=")[1]
            )

            existing_course = session.exec(
                select(Course).where(
                    Course.initial_id == vns_id
                )
            ).first()

            if existing_course:

                existing_course.name = (
                    course["title"]
                )

                continue

            session.add(
                Course(
                    name=course["title"],
                    description="",
                    initial_id=vns_id,
                )
            )

        session.commit()