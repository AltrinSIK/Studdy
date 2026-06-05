from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import select
from app.api import deps
from app.models import Task, File as DBFile, TaskSubmission
import uuid
from pathlib import Path
import os

router = APIRouter(prefix="/courses/tasks", tags=["tasks"])

# GET task
@router.get("/{task_id}")
def read_task(
    task_id: uuid.UUID,
    session=Depends(deps.get_db),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# UPLOAD task submission

@router.post("/{task_id}/upload")
async def upload_report(
    task_id: uuid.UUID,
    file: UploadFile = File(...),
    session=Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    """
    Upload a file for task submission and save it to the database.
    """
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Read file content and persist to disk
    content = await file.read()

    uploads_dir = Path("uploads")
    try:
        uploads_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not create uploads directory: {e}")

    unique_name = f"{uuid.uuid4()}_{file.filename}"
    dest_path = uploads_dir / unique_name
    try:
        with open(dest_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save uploaded file: {e}")

    # Create and save file record in database
    db_file = DBFile(
        name=file.filename,
        size=len(content),
        file_path=str(dest_path),
        user_id=current_user.id,
    )

    try:
        session.add(db_file)
        session.commit()
        session.refresh(db_file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error saving file record: {e}")

    # Create task submission linking uploaded file to task and user
    try:
        submission = TaskSubmission(task_id=task.id, file_id=db_file.id, user_id=current_user.id)
        session.add(submission)
        session.commit()
        session.refresh(submission)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error creating submission: {e}")

    return {
        "status": "success",
        "filename": file.filename,
        "file_id": str(db_file.id),
        "submission_id": str(submission.id),
        "size": len(content),
    }
