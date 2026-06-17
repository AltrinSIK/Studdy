from asyncio import tasks

from fastapi import APIRouter

from app.api.routes import (
    items,
    login,
    private,
    users,
    utils,
    courses,
    terms,
    task,
    schedule,
)
from app.core.config import settings
from app.api.routes import ai

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(users.router)
api_router.include_router(task.router)
api_router.include_router(courses.router)
api_router.include_router(schedule.router)
api_router.include_router(terms.router)
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])



if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
