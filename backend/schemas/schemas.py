from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"

class TaskStatus(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

# User Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: UserRole
    created_at: datetime
    
    class Config:
        from_attributes = True

# Project Schemas
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    total_tasks: int = 0
    completed_tasks: int = 0
    in_progress_tasks: int = 0
    
    class Config:
        from_attributes = True

class ProjectDetailResponse(ProjectResponse):
    """Project with team members included"""
    project_members: List['ProjectMemberResponse'] = []
    
    @model_validator(mode='before')
    @classmethod
    def map_members(cls, data):
        """Map ORM 'members' attribute to 'project_members' field"""
        if isinstance(data, dict):
            if 'members' in data and 'project_members' not in data:
                data['project_members'] = data.pop('members', [])
        else:
            # Handle ORM objects
            if hasattr(data, 'members') and not hasattr(data, 'project_members'):
                data.project_members = data.members
        return data

# Task Schemas
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: Optional[TaskStatus] = TaskStatus.TODO
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: Optional[str]
    assigned_to: Optional[str]
    created_by: str
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Project Member Schemas
class ProjectMemberCreate(BaseModel):
    user_id: str
    role: UserRole = UserRole.MEMBER

class ProjectMemberResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    role: UserRole
    joined_at: datetime
    user: Optional['UserResponse'] = None
    
    class Config:
        from_attributes = True

# Task Comment Schemas
class TaskCommentCreate(BaseModel):
    content: str = Field(..., min_length=1)

class TaskCommentResponse(BaseModel):
    id: str
    task_id: str
    user_id: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth Response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

# Activity Log Schemas
class ActivityLogResponse(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str]
    action: str
    entity_type: str
    entity_id: str
    changes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    total_projects: int

class DashboardResponse(BaseModel):
    stats: DashboardStats
    assigned_tasks: List[TaskResponse]
    projects: List[ProjectResponse]
