from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlmodel import (
    Session,
    select,
)

from app.api import deps

from app.models import (
    Course,
    TaskType,
    Task,
    UserCourseLink,
)

from app.core.db import engine

router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


@router.get("/")
def get_courses():

    with Session(engine) as session:

        courses = session.query(
            Course,
        ).all()

        return courses


@router.get("/tasks")
def get_tasks(
    task_type_id: str,
    session=Depends(
        deps.get_db,
    ),
):

    tasks = session.exec(

        select(Task).where(
            Task.task_type_id
            == task_type_id
        )

    ).all()

    return tasks


@router.get("/tasks/{task_id}")
def get_task(
    task_id: str,
    session=Depends(
        deps.get_db,
    ),
):

    task = session.get(
        Task,
        task_id,
    )

    if not task:

        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task


@router.get("/task-types/{task_type_id}")
def get_task_type(
    task_type_id: str,
):

    with Session(engine) as session:

        task_type = session.get(
            TaskType,
            task_type_id,
        )

        if not task_type:

            raise HTTPException(
                status_code=404,
                detail="Task type not found",
            )

        return task_type


@router.get("/{course_id}/task-types")
def get_task_types(
    course_id: str,
):

    with Session(engine) as session:

        task_types = session.exec(

            select(TaskType).where(
                TaskType.course_id
                == course_id
            )

        ).all()

        return task_types


@router.get("/me")
def get_my_courses(
    current_user: deps.CurrentUser,
    session=Depends(
        deps.get_db,
    ),
):

    courses = session.exec(
        select(Course)
        .join(UserCourseLink)
        .where(UserCourseLink.user_id == current_user.id)
    ).all()

    return courses


@router.get("/{course_id}")
def get_course(
    course_id: str,
):

    with Session(engine) as session:

        course = session.get(
            Course,
            course_id,
        )

        if not course:

            raise HTTPException(
                status_code=404,
                detail="Course not found",
            )

        return course