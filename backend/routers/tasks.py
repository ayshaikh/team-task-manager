from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from database import get_db
from models.models import Task, User, Project, ProjectMember, TaskStatus, Notification
from schemas.schemas import TaskCreate, TaskResponse, TaskUpdate, TaskStatusUpdate
from routers.auth import get_current_user
from sockets.events import sio
from utils.activity_logger import ActivityLogger

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("/project/{project_id}", response_model=List[TaskResponse])
async def get_project_tasks(
    project_id: str,
    task_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tasks for a specific project, optionally filtered by status"""
    # Check if user has access to this project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    is_owner = project.owner_id == current_user.id
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not is_owner and not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Get tasks
    query = db.query(Task).filter(Task.project_id == project_id)
    if task_status:
        query = query.filter(Task.status == task_status)
    
    tasks = query.all()
    return tasks

@router.get("/my-tasks", response_model=List[TaskResponse])
async def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks assigned to the current user"""
    tasks = db.query(Task).filter(Task.assigned_to == current_user.id).all()
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Check authorization
    project = db.query(Project).filter(Project.id == task.project_id).first()
    is_owner = project.owner_id == current_user.id
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == task.project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not is_owner and not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    return task

@router.post("/{project_id}", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: str,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new task in a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    # Check authorization - only project members can create tasks
    is_owner = project.owner_id == current_user.id
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not is_owner and not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Create task
    new_task = Task(
        id=str(uuid4()),
        project_id=project_id,
        title=task_data.title,
        description=task_data.description or "",
        assigned_to=task_data.assigned_to,
        created_by=current_user.id,
        status=task_data.status or TaskStatus.TODO,
        priority=task_data.priority,
        due_date=task_data.due_date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Notification for assignee
    if new_task.assigned_to:
        new_notif = Notification(
            user_id=new_task.assigned_to,
            title="New Task Assigned",
            message=f"You have been assigned a new task: '{new_task.title}'",
            type="assignment",
            link=f"/projects/{new_task.project_id}/board?task={new_task.id}"
        )
        db.add(new_notif)
        db.commit()
    
    # Log activity
    ActivityLogger.log_task_created(
        db, current_user.id, project_id, new_task.id,
        {
            'title': new_task.title,
            'priority': new_task.priority,
            'status': new_task.status,
            'username': current_user.username
        }
    )
    
    # Note: We don't broadcast task_created from HTTP endpoints.
    # Clients add tasks immediately from API response.
    # Socket events are only for direct socket-to-socket client communication.
    # Other clients will see the task when they refresh or poll for updates.
    
    return new_task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Check authorization
    project = db.query(Project).filter(Project.id == task.project_id).first()
    is_owner = project.owner_id == current_user.id
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == task.project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not is_owner and not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Track updates for Socket.io event
    updates = {}
    
    # Update fields
    if task_data.title:
        task.title = task_data.title
        updates['title'] = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
        updates['description'] = task_data.description
    
    update_data = task_data.dict(exclude_unset=True)
    if task_data.assigned_to is not None:
        task.assigned_to = task_data.assigned_to
        updates['assigned_to'] = task_data.assigned_to
    if task_data.priority:
        task.priority = task_data.priority
        updates['priority'] = task_data.priority
    if task_data.due_date is not None:
        task.due_date = task_data.due_date
        updates['due_date'] = str(task_data.due_date) if task_data.due_date else None
    
    task.updated_at = datetime.utcnow()
    
    # Log activity
    if updates:
        updates['task_title'] = task.title
        updates['username'] = current_user.username
        ActivityLogger.log_task_updated(
            db, current_user.id, task.project_id, task_id, updates
        )
        
        # Notification if reassigned
        if "assigned_to" in update_data and update_data["assigned_to"] and update_data["assigned_to"] != current_user.id:
            new_notif = Notification(
                user_id=update_data["assigned_to"],
                title="Task Assigned",
                message=f"Task '{task.title}' has been assigned to you by {current_user.username}",
                type="assignment",
                link=f"/projects/{task.project_id}/board?task={task.id}"
            )
            db.add(new_notif)

    db.commit()
    db.refresh(task)
    
    # Emit Socket.io event
    if updates:
        await sio.emit(
            'task_updated',
            {
                'task_id': task_id,
                'updates': updates,
                'timestamp': datetime.utcnow().isoformat()
            },
            room=f'project_{task.project_id}'
        )
    
    return task

@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: str,
    status_update: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update only task status (for Kanban board)"""
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Check authorization
    project = db.query(Project).filter(Project.id == task.project_id).first()
    is_owner = project.owner_id == current_user.id
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == task.project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not is_owner and not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    old_status = task.status
    task.status = status_update.status
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    # Log activity
    ActivityLogger.log_task_status_changed(
        db, current_user.id, task.project_id, task_id,
        old_status=old_status,
        new_status=status_update.status,
        task_title=task.title,
        username=current_user.username
    )
    
    # Emit Socket.io event for status change
    await sio.emit(
        'task_status_changed',
        {
            'task_id': task_id,
            'status': status_update.status,
            'timestamp': datetime.utcnow().isoformat()
        },
        room=f'project_{task.project_id}'
    )
    
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Check authorization - only creator or project owner can delete
    project = db.query(Project).filter(Project.id == task.project_id).first()
    is_owner = project.owner_id == current_user.id
    is_creator = task.created_by == current_user.id
    
    if not is_owner and not is_creator:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    project_id = task.project_id
    task_title = task.title
    
    try:
        db.delete(task)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error deleting task record: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {str(e)}")
    
    # Log activity and emit socket event (best effort, don't fail the whole request if these fail)
    try:
        ActivityLogger.log_task_deleted(db, current_user.id, project_id, task_id, task_title=task_title, username=current_user.username)
        
        # Emit Socket.io event
        await sio.emit(
            'task_deleted',
            {
                'task_id': task_id,
                'timestamp': datetime.utcnow().isoformat()
            },
            room=f'project_{project_id}'
        )
    except Exception as e:
        print(f"Error in post-delete actions: {e}")
        # We don't raise here because the task IS deleted in the DB
    
    return None
