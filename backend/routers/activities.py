"""
Notifications and activity log endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from datetime import datetime
from database import get_db
from models.models import ActivityLog, Project, ProjectMember
from routers.auth import get_current_user
from sqlalchemy.orm import joinedload
from pydantic import BaseModel, field_validator
import json

router = APIRouter(prefix="/api", tags=["activities"])

class UserMinimal(BaseModel):
    id: str
    username: str
    
    class Config:
        from_attributes = True

class ActivityResponse(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str]
    action: str
    entity_type: str
    entity_id: str
    changes: Any = {}
    created_at: datetime
    user: Optional[UserMinimal] = None
    
    @field_validator('changes', mode='before')
    @classmethod
    def parse_changes(cls, v):
        """Handle changes that may be stored as JSON string, dict, or None"""
        if v is None:
            return {}
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return {"raw": v}
        if isinstance(v, dict):
            return v
        return {}
    
    class Config:
        from_attributes = True

@router.get("/projects/{project_id}/activities", response_model=List[ActivityResponse])
async def get_project_activities(
    project_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get activity log for a project"""
    # Check if user has access to project
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
    
    # Get recent activities
    activities = db.query(ActivityLog).options(joinedload(ActivityLog.user)).filter(
        ActivityLog.project_id == project_id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()

    # Manual enrichment if needed
    for act in activities:
        if not act.user:
            continue
        # Ensure changes has username if it's missing
        if isinstance(act.changes, str):
            try:
                changes_dict = json.loads(act.changes)
                if 'username' not in changes_dict:
                    changes_dict['username'] = act.user.username
                    act.changes = json.dumps(changes_dict)
            except:
                pass
        elif isinstance(act.changes, dict):
            if 'username' not in act.changes:
                act.changes['username'] = act.user.username
    
    return activities

@router.get("/my-activities", response_model=List[ActivityResponse])
async def get_my_activities(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get activity log for current user"""
    # Get recent activities
    activities = db.query(ActivityLog).options(joinedload(ActivityLog.user)).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()

    # Manual enrichment
    for act in activities:
        if not act.user:
            continue
        if isinstance(act.changes, str):
            try:
                changes_dict = json.loads(act.changes)
                if 'username' not in changes_dict:
                    changes_dict['username'] = act.user.username
                    act.changes = json.dumps(changes_dict)
            except: pass
        elif isinstance(act.changes, dict):
            if 'username' not in act.changes:
                act.changes['username'] = act.user.username
    
    return activities
