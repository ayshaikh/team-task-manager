from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Enum, Text, Integer
from sqlalchemy.orm import relationship
import uuid
import enum
from database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"

class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    projects = relationship("Project", back_populates="owner", foreign_keys="Project.owner_id")
    tasks = relationship("Task", back_populates="assigned_to_user", foreign_keys="Task.assigned_to")
    created_tasks = relationship("Task", back_populates="created_by_user", foreign_keys="Task.created_by")
    project_members = relationship("ProjectMember", back_populates="user")
    comments = relationship("TaskComment", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE or ARCHIVED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="projects", foreign_keys=[owner_id])
    members = relationship("ProjectMember", back_populates="project")
    tasks = relationship("Task", back_populates="project")
    activity_logs = relationship("ActivityLog", back_populates="project")

class ProjectMember(Base):
    __tablename__ = "project_members"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_members")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    assigned_to_user = relationship("User", back_populates="tasks", foreign_keys=[assigned_to])
    created_by_user = relationship("User", back_populates="created_tasks", foreign_keys=[created_by])
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")

class TaskComment(Base):
    __tablename__ = "task_comments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    task = relationship("Task", back_populates="comments")
    user = relationship("User", back_populates="comments")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    action = Column(String(50), nullable=False)  # created, updated, assigned, deleted
    entity_type = Column(String(50), nullable=False)  # task, project
    entity_id = Column(String(36), nullable=False)
    changes = Column(Text, nullable=True)  # JSON changes
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="activity_logs")
    project = relationship("Project", back_populates="activity_logs")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=True) # assignment, deadline, team_join
    link = Column(String(255), nullable=True) # link to task or project
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
