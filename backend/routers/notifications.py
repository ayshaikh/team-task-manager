"""
Notifications endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
from models.models import Notification, User, Task, TaskStatus
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: Optional[str]
    link: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get recent notifications for current user"""
    # Check for upcoming deadlines
    now = datetime.utcnow()
    near_future = now + timedelta(hours=24)
    
    tasks_near_deadline = db.query(Task).filter(
        Task.assigned_to == current_user.id,
        Task.due_date > now,
        Task.due_date <= near_future,
        Task.status != TaskStatus.COMPLETED
    ).all()
    
    for task in tasks_near_deadline:
        # Check if we already notified for this task's deadline
        exists = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.type == "deadline",
            Notification.link.contains(task.id)
        ).first()
        
        if not exists:
            new_notif = Notification(
                user_id=current_user.id,
                title="Task Deadline Near",
                message=f"Task '{task.title}' is due in less than 24 hours!",
                type="deadline",
                link=f"/projects/{task.project_id}/board?task={task.id}"
            )
            db.add(new_notif)
    
    if tasks_near_deadline:
        try:
            db.commit()
        except:
            db.rollback()

    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).order_by(Notification.created_at.desc()).limit(limit).all()
    
    return notifications

@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mark a specific notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mark all notifications as read for current user"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {"status": "success"}
