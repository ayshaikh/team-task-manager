"""
Activity logging utility for tracking project actions
"""
from sqlalchemy.orm import Session
from models.models import ActivityLog, User
from uuid import uuid4
from datetime import datetime
import json

class ActivityLogger:
    """Utility class for logging project activities"""
    
    @staticmethod
    def log_activity(
        db: Session,
        user_id: str,
        project_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        changes: dict = None
    ):
        """
        Log an activity to the database
        
        Args:
            db: Database session
            user_id: ID of user performing the action
            project_id: ID of project (context)
            action: Action type (created, updated, deleted, moved, etc)
            entity_type: Type of entity (Task, Project, Member, etc)
            entity_id: ID of entity being affected
            changes: Dictionary of changes made
        """
        changes = changes or {}
        
        # Ensure username is present for the frontend
        if not changes.get('username'):
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                changes['username'] = user.username

        try:
            activity = ActivityLog(
                id=str(uuid4()),
                user_id=user_id,
                project_id=project_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                changes=json.dumps(changes) if changes else json.dumps({}),
                created_at=datetime.utcnow()
            )
            db.add(activity)
            db.commit()
            db.refresh(activity)
            return activity
        except Exception as e:
            print(f"Error logging activity: {e}")
            db.rollback()
            return None
    
    @staticmethod
    def log_task_created(db: Session, user_id: str, project_id: str, task_id: str, task_data: dict):
        """Log task creation"""
        return ActivityLogger.log_activity(
            db, user_id, project_id, 
            action="created",
            entity_type="Task",
            entity_id=task_id,
            changes={
                "task": task_data,
                "task_title": task_data.get('title'),
                "username": task_data.get('username')
            }
        )
    
    @staticmethod
    def log_task_updated(db: Session, user_id: str, project_id: str, task_id: str, changes: dict):
        """Log task update"""
        if 'task_title' not in changes:
            # Try to find title if not provided
            pass
            
        return ActivityLogger.log_activity(
            db, user_id, project_id,
            action="updated",
            entity_type="Task",
            entity_id=task_id,
            changes=changes
        )
    
    @staticmethod
    def log_task_status_changed(db: Session, user_id: str, project_id: str, task_id: str, old_status: str, new_status: str, task_title: str = None, username: str = None):
        """Log task status change"""
        return ActivityLogger.log_activity(
            db, user_id, project_id,
            action="status_changed",
            entity_type="Task",
            entity_id=task_id,
            changes={
                "old_status": old_status, 
                "new_status": new_status,
                "task_title": task_title,
                "username": username
            }
        )
    
    @staticmethod
    def log_task_deleted(db: Session, user_id: str, project_id: str, task_id: str, task_title: str = None, username: str = None):
        """Log task deletion"""
        return ActivityLogger.log_activity(
            db, user_id, project_id,
            action="deleted",
            entity_type="Task",
            entity_id=task_id,
            changes={
                "task_title": task_title,
                "username": username
            }
        )
    
    @staticmethod
    def log_member_added(db: Session, user_id: str, project_id: str, member_id: str, member_email: str):
        """Log member addition"""
        return ActivityLogger.log_activity(
            db, user_id, project_id,
            action="added",
            entity_type="ProjectMember",
            entity_id=member_id,
            changes={"email": member_email}
        )
    
    @staticmethod
    def log_member_removed(db: Session, user_id: str, project_id: str, member_id: str, member_email: str):
        """Log member removal"""
        return ActivityLogger.log_activity(
            db, user_id, project_id,
            action="removed",
            entity_type="ProjectMember",
            entity_id=member_id,
            changes={"email": member_email}
        )
