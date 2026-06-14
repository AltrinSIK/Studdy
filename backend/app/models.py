from enum import IntEnum
import uuid
from datetime import datetime, time, timezone

from pydantic import EmailStr
from sqlalchemy import DateTime, func
from sqlmodel import Enum, Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UserCourseLink(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    course_id: uuid.UUID = Field(foreign_key="course.id", primary_key=True)

# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    courses: list["Course"] = Relationship(
        back_populates="users",
        link_model=UserCourseLink
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore[assignment]


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

class CourseBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class Course(CourseBase, table=True):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column_kwargs={"server_default": func.gen_random_uuid()}
    )

    initial_id: str = Field(unique=True, index=True, min_length=0, max_length=255)
    task_types: list["TaskType"] = Relationship(back_populates="course")
    lessons: list["Lesson"] = Relationship(back_populates="course")

    users: list["User"] = Relationship(
        back_populates="courses",
        link_model=UserCourseLink
    )

class TaskTypeBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    course_id: uuid.UUID = Field(foreign_key="course.id")


class TaskType(TaskTypeBase, table=True):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column_kwargs={"server_default": func.gen_random_uuid()}
    )

    course: "Course" = Relationship(back_populates="task_types")
    tasks: list["Task"] = Relationship(back_populates="task_type")

class TaskBase(SQLModel):
    name: str
    description: str | None = None
    task_type_id: uuid.UUID = Field(foreign_key="tasktype.id")


class Task(TaskBase, table=True):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column_kwargs={"server_default": func.gen_random_uuid()}
    )

    task_type: "TaskType" = Relationship(back_populates="tasks")

    materials: list["TaskMaterial"] = Relationship(back_populates="task")
    submissions: list["TaskSubmission"] = Relationship(back_populates="task")

class FileBase(SQLModel):
    name: str
    file_path: str
    size: int


class File(FileBase, table=True):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column_kwargs={"server_default": func.gen_random_uuid()}
    )

    user_id: uuid.UUID = Field(foreign_key="user.id")

class TaskMaterial(SQLModel, table=True):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column_kwargs={"server_default": func.gen_random_uuid()}
    )
    task_id: uuid.UUID = Field(foreign_key="task.id")
    file_id: uuid.UUID = Field(foreign_key="file.id")

    task: "Task" = Relationship(back_populates="materials")
    file: "File" = Relationship()

class TaskSubmission(SQLModel, table=True):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column_kwargs={"server_default": func.gen_random_uuid()}
    )

    task_id: uuid.UUID = Field(foreign_key="task.id")
    file_id: uuid.UUID = Field(foreign_key="file.id")
    user_id: uuid.UUID = Field(foreign_key="user.id")

    grade: int | None = None
    comment: str | None = None

    task: "Task" = Relationship(back_populates="submissions")
    file: "File" = Relationship()

class WeekEnum(IntEnum):
    WEEK_1 = 1
    WEEK_2 = 2

class LessonBase(SQLModel):
    name: str
    description: str | None = None
    week: WeekEnum = Field()
    lesson_number: int = Field()
    time_start: time | None = Field(default=None)
    time_end: time | None = Field(default=None)
    course_id: uuid.UUID = Field(foreign_key="course.id")

class Lesson(LessonBase, table=True):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column_kwargs={"server_default": func.gen_random_uuid()}
    )

    course: "Course" = Relationship(back_populates="lessons")