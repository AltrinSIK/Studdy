import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from sqlmodel import Session, SQLModel, select

from app.api import deps
from app.core.db import engine
from app.models import Course, Lesson, UserCourseLink

router = APIRouter(prefix="/schedule", tags=["Schedule"])


class LessonSchedule(SQLModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    week: int
    lesson_number: int
    time_start: datetime | None = None
    time_end: datetime | None = None
    course_id: uuid.UUID
    course_name: str


@router.get("/me", response_model=List[LessonSchedule])
def get_my_schedule(
    current_user: deps.CurrentUser,
    session: Session = Depends(deps.get_db),
):
    course_ids = session.exec(
        select(Course.id)
        .join(UserCourseLink)
        .where(UserCourseLink.user_id == current_user.id)
    ).all()

    if not course_ids:
        return []

    rows = session.exec(
        select(Lesson, Course.name)
        .join(Course)
        .where(
            Lesson.course_id == Course.id,
            Lesson.course_id.in_(course_ids),
        )
        .order_by(Lesson.week, Lesson.lesson_number)
    ).all()

    schedule: List[LessonSchedule] = []
    for lesson, course_name in rows:
        schedule.append(
            LessonSchedule(
                id=lesson.id,
                name=lesson.name,
                description=lesson.description,
                week=int(lesson.week),
                lesson_number=lesson.lesson_number,
                time_start=lesson.time_start,
                time_end=lesson.time_end,
                course_id=lesson.course_id,
                course_name=course_name,
            )
        )

    return schedule
