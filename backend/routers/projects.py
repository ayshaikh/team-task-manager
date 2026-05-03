from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from uuid import uuid4
from database import get_db
from models.models import Project, ProjectMember, User, Notification
from schemas.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse
from routers.auth import get_current_user
from utils.activity_logger import ActivityLogger
from models.models import Task, TaskStatus

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("", response_model=list[ProjectResponse])
async def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all projects the user is a member of"""
    # Get projects where user is owner or member, with tasks eager loaded
    projects = db.query(Project).options(joinedload(Project.tasks)).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(ProjectMember.user_id == current_user.id))
    ).all()
    
    # Populate stats for each project
    results = []
    for p in projects:
        total = len(p.tasks)
        completed = len([t for t in p.tasks if t.status == "COMPLETED" or t.status == TaskStatus.COMPLETED])
        in_progress = len([t for t in p.tasks if t.status == "IN_PROGRESS" or t.status == TaskStatus.IN_PROGRESS])
        
        # Create a dict that matches ProjectResponse
        project_dict = {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "owner_id": p.owner_id,
            "status": p.status,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "total_tasks": total,
            "completed_tasks": completed,
            "in_progress_tasks": in_progress
        }
        results.append(project_dict)
        
    return results

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a specific project with team members"""
    # Eagerly load members, their users, and tasks
    project = db.query(Project).options(
        joinedload(Project.members).joinedload(ProjectMember.user),
        joinedload(Project.tasks)
    ).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    # Check if user has access
    is_owner = project.owner_id == current_user.id
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not is_owner and not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this project")
    
    # Populate stats
    project.total_tasks = len(project.tasks)
    project.completed_tasks = len([t for t in project.tasks if t.status == "COMPLETED" or t.status == TaskStatus.COMPLETED])
    project.in_progress_tasks = len([t for t in project.tasks if t.status == "IN_PROGRESS" or t.status == TaskStatus.IN_PROGRESS])
    
    return project

@router.post("", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new project"""
    new_project = Project(
        id=str(uuid4()),
        name=project.name,
        description=project.description or "",
        owner_id=current_user.id,
        status="ACTIVE",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update a project (owner only)"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if db_project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner can update")
    
    if project.name:
        db_project.name = project.name
    if project.description is not None:
        db_project.description = project.description
    if project.status:
        db_project.status = project.status
    
    db_project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a project (owner only)"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if db_project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner can delete")
    
    db.delete(db_project)
    db.commit()

@router.post("/{project_id}/members", status_code=status.HTTP_201_CREATED)
async def add_team_member(project_id: str, user_email: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Add a team member to a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner can add members")
    
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Check if already a member
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member")
    
    # Add member
    member = ProjectMember(
        project_id=project_id,
        user_id=user.id,
        role="MEMBER",
        joined_at=datetime.utcnow()
    )
    
    db.add(member)
    db.commit()
    
    # Log activity
    ActivityLogger.log_member_added(db, current_user.id, project_id, user.id, user.email)
    
    # Create notification for the new member
    new_notif = Notification(
        user_id=user.id,
        title="Added to Team",
        message=f"You have been added to the project '{project.name}' by {current_user.username}.",
        type="team_join",
        link=f"/projects/{project_id}/board"
    )
    db.add(new_notif)
    db.commit()
    
    return {"message": "Team member added successfully"}

@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(project_id: str, user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Remove a team member from a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner can remove members")
    
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in project")
    
    member_email = member.user.email if member.user else "Unknown"
    
    db.delete(member)
    db.commit()
    
    # Log activity
    ActivityLogger.log_member_removed(db, current_user.id, project_id, user_id, member_email)

@router.get("/{project_id}/stats")
async def get_project_stats(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get task statistics for a specific project"""
    # Check authorization (same as get_project)
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
    
    # Get stats
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    
    total = len(tasks)
    todo = len([t for t in tasks if t.status == TaskStatus.TODO])
    in_progress = len([t for t in tasks if t.status == TaskStatus.IN_PROGRESS])
    completed = len([t for t in tasks if t.status == TaskStatus.COMPLETED])
    
    now = datetime.utcnow()
    overdue = len([t for t in tasks if t.due_date and t.due_date < now and t.status != TaskStatus.COMPLETED])
    
    return {
        "total": total,
        "todo": todo,
        "inProgress": in_progress,
        "completed": completed,
        "overdue": overdue,
        "tasks": tasks # Also return the tasks list for the dashboard grid
    }
