"""
Seed script  Inserts realistic demo data directly into the SQLite database
to showcase the full TaskFlow project performance.

Users, projects, members, tasks (across all statuses), and activity logs
are all populated to match the design spec.

Run:  python seed_demo_data.py
"""

import sys
import os
import json
from uuid import uuid4
from datetime import datetime, timedelta

# Add parent to path so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models.models import (
    User, Project, ProjectMember, Task, TaskComment, ActivityLog, Notification,
    UserRole, TaskStatus, TaskPriority,
)
from utils.security import hash_password

# 
#  Helpers
# 
def uid():
    return str(uuid4())

def ago(days=0, hours=0, minutes=0):
    """Return a datetime `n` units in the past."""
    return datetime.utcnow() - timedelta(days=days, hours=hours, minutes=minutes)

def future(days=0):
    """Return a datetime `n` days from now."""
    return datetime.utcnow() + timedelta(days=days)

PASSWORD = hash_password("SecurePass@123")

# 
#  Static IDs (so FK references are consistent)
# 
# Users
AK_ID = uid()   # Arjun Kumar   Admin / Owner
SR_ID = uid()   # Sneha Reddy   Member
PM_ID = uid()   # Priya Menon   Member
MJ_ID = uid()   # Marcus James  Member (extra)

# Projects
PROJ_WEB_ID = uid()   # Website Redesign
PROJ_MOB_ID = uid()   # Mobile App v2
PROJ_API_ID = uid()   # API Integration

# 
#  Seed function
# 
def seed():
    db = SessionLocal()

    # Wipe existing data (order matters for FK constraints)
    print("  Clearing existing data...")
    db.query(Notification).delete()
    db.query(ActivityLog).delete()
    db.query(TaskComment).delete()
    db.query(Task).delete()
    db.query(ProjectMember).delete()
    db.query(Project).delete()
    db.query(User).delete()
    db.commit()

    #  Users 
    print(" Creating users...")
    users = [
        User(id=AK_ID, username="Arjun K.", email="arjun@techcorp.com",
             password_hash=PASSWORD, role=UserRole.ADMIN,
             created_at=ago(days=30), updated_at=ago(days=30)),
        User(id=SR_ID, username="Sneha R.", email="sneha@techcorp.com",
             password_hash=PASSWORD, role=UserRole.MEMBER,
             created_at=ago(days=28), updated_at=ago(days=28)),
        User(id=PM_ID, username="Priya M.", email="priya@techcorp.com",
             password_hash=PASSWORD, role=UserRole.MEMBER,
             created_at=ago(days=25), updated_at=ago(days=25)),
        User(id=MJ_ID, username="Marcus J.", email="marcus@techcorp.com",
             password_hash=PASSWORD, role=UserRole.MEMBER,
             created_at=ago(days=20), updated_at=ago(days=20)),
    ]
    db.add_all(users)
    db.commit()

    #  Projects 
    print(" Creating projects...")
    projects = [
        Project(id=PROJ_WEB_ID, name="Website Redesign",
                description="Complete redesign of the company website with modern UI/UX, responsive layouts, and improved conversion funnels.",
                owner_id=AK_ID, status="COMPLETED",
                created_at=ago(days=14), updated_at=ago(hours=2)),
        Project(id=PROJ_MOB_ID, name="Mobile App v2",
                description="Version 2 of the mobile application with push notifications, offline mode, and redesigned onboarding flow.",
                owner_id=AK_ID, status="ACTIVE",
                created_at=ago(days=10), updated_at=ago(hours=5)),
        Project(id=PROJ_API_ID, name="API Integration",
                description="Build REST API layer for third-party integrations including payment gateway, analytics, and CRM sync.",
                owner_id=AK_ID, status="ACTIVE",
                created_at=ago(days=7), updated_at=ago(days=1)),
    ]
    db.add_all(projects)
    db.commit()

    #  Project Members 
    print(" Adding project members...")
    members = [
        # Website Redesign  all 3 core members
        ProjectMember(id=uid(), project_id=PROJ_WEB_ID, user_id=AK_ID,
                      role=UserRole.ADMIN, joined_at=ago(days=14)),
        ProjectMember(id=uid(), project_id=PROJ_WEB_ID, user_id=SR_ID,
                      role=UserRole.MEMBER, joined_at=ago(days=13)),
        ProjectMember(id=uid(), project_id=PROJ_WEB_ID, user_id=PM_ID,
                      role=UserRole.MEMBER, joined_at=ago(days=12)),
        # Mobile App v2  AK + SR + Marcus
        ProjectMember(id=uid(), project_id=PROJ_MOB_ID, user_id=AK_ID,
                      role=UserRole.ADMIN, joined_at=ago(days=10)),
        ProjectMember(id=uid(), project_id=PROJ_MOB_ID, user_id=SR_ID,
                      role=UserRole.MEMBER, joined_at=ago(days=9)),
        ProjectMember(id=uid(), project_id=PROJ_MOB_ID, user_id=MJ_ID,
                      role=UserRole.MEMBER, joined_at=ago(days=8)),
        # API Integration  AK + PM + Marcus
        ProjectMember(id=uid(), project_id=PROJ_API_ID, user_id=AK_ID,
                      role=UserRole.ADMIN, joined_at=ago(days=7)),
        ProjectMember(id=uid(), project_id=PROJ_API_ID, user_id=PM_ID,
                      role=UserRole.MEMBER, joined_at=ago(days=6)),
        ProjectMember(id=uid(), project_id=PROJ_API_ID, user_id=MJ_ID,
                      role=UserRole.MEMBER, joined_at=ago(days=5)),
    ]
    db.add_all(members)
    db.commit()

    #  Tasks 
    print(" Creating tasks...")

    #  Website Redesign Tasks 
    web_tasks = [
        # TODO (3)
        Task(id=uid(), project_id=PROJ_WEB_ID,
             title="Redesign landing page hero section",
             description="Update copy, replace background, add CTA button animations.",
             assigned_to=AK_ID, created_by=AK_ID,
             status=TaskStatus.TODO, priority=TaskPriority.HIGH,
             due_date=future(days=27),
             created_at=ago(days=5), updated_at=ago(days=5)),
        Task(id=uid(), project_id=PROJ_WEB_ID,
             title="Write SEO meta descriptions",
             description="Write unique meta descriptions for all 12 key landing pages.",
             assigned_to=SR_ID, created_by=AK_ID,
             status=TaskStatus.TODO, priority=TaskPriority.LOW,
             due_date=future(days=34),
             created_at=ago(days=4), updated_at=ago(days=4)),
        Task(id=uid(), project_id=PROJ_WEB_ID,
             title="Set up analytics tracking",
             description="Install Google Analytics 4 and configure conversion events for signup, demo booking, and pricing page visits.",
             assigned_to=PM_ID, created_by=AK_ID,
             status=TaskStatus.TODO, priority=TaskPriority.MEDIUM,
             due_date=future(days=20),
             created_at=ago(days=3), updated_at=ago(days=3)),

        # IN_PROGRESS (3)
        Task(id=uid(), project_id=PROJ_WEB_ID,
             title="Build component library in Figma",
             description="Buttons, inputs, cards, modals  all in a shared Figma library with auto-layout.",
             assigned_to=SR_ID, created_by=SR_ID,
             status=TaskStatus.IN_PROGRESS, priority=TaskPriority.HIGH,
             due_date=future(days=4),
             created_at=ago(days=7), updated_at=ago(hours=3)),
        Task(id=uid(), project_id=PROJ_WEB_ID,
             title="Mobile responsive breakpoints",
             description="Implement responsive CSS for tablet (768px) and mobile (375px) breakpoints across all pages.",
             assigned_to=PM_ID, created_by=SR_ID,
             status=TaskStatus.IN_PROGRESS, priority=TaskPriority.MEDIUM,
             due_date=future(days=21),
             created_at=ago(days=6), updated_at=ago(minutes=14)),
        Task(id=uid(), project_id=PROJ_WEB_ID,
             title="Implement dark mode toggle",
             description="Add dark mode with CSS custom properties and a toggle in the navbar. Persist preference in localStorage.",
             assigned_to=AK_ID, created_by=AK_ID,
             status=TaskStatus.IN_PROGRESS, priority=TaskPriority.LOW,
             due_date=future(days=15),
             created_at=ago(days=4), updated_at=ago(hours=1)),

        # COMPLETED (3)
        Task(id=uid(), project_id=PROJ_WEB_ID,
             title="Set up Vite + React project",
             description="Initialize project with Vite, React 19, React Router, and Tailwind CSS.",
             assigned_to=AK_ID, created_by=AK_ID,
             status=TaskStatus.COMPLETED, priority=TaskPriority.HIGH,
             due_date=ago(days=10),
             created_at=ago(days=14), updated_at=ago(days=10)),
        Task(id=uid(), project_id=PROJ_WEB_ID,
             title="Design color palette and typography",
             description="Select primary, secondary, and accent colors. Choose heading and body fonts from Google Fonts.",
             assigned_to=SR_ID, created_by=AK_ID,
             status=TaskStatus.COMPLETED, priority=TaskPriority.MEDIUM,
             due_date=ago(days=8),
             created_at=ago(days=13), updated_at=ago(days=9)),
        Task(id=uid(), project_id=PROJ_WEB_ID,
             title="Create wireframes for all pages",
             description="Low-fidelity wireframes for Home, About, Pricing, Blog, and Contact pages.",
             assigned_to=PM_ID, created_by=SR_ID,
             status=TaskStatus.COMPLETED, priority=TaskPriority.MEDIUM,
             due_date=ago(days=7),
             created_at=ago(days=12), updated_at=ago(days=7)),
    ]
    db.add_all(web_tasks)

    #  Mobile App v2 Tasks 
    mob_tasks = [
        # TODO
        Task(id=uid(), project_id=PROJ_MOB_ID,
             title="Design push notification system",
             description="Define notification types, channels, and user preferences for push notifications.",
             assigned_to=AK_ID, created_by=AK_ID,
             status=TaskStatus.TODO, priority=TaskPriority.HIGH,
             due_date=future(days=10),
             created_at=ago(days=5), updated_at=ago(days=5)),
        Task(id=uid(), project_id=PROJ_MOB_ID,
             title="Implement offline data sync",
             description="Use SQLite for local caching. Queue mutations while offline and sync on reconnect.",
             assigned_to=MJ_ID, created_by=AK_ID,
             status=TaskStatus.TODO, priority=TaskPriority.HIGH,
             due_date=future(days=14),
             created_at=ago(days=4), updated_at=ago(days=4)),
        Task(id=uid(), project_id=PROJ_MOB_ID,
             title="Write unit tests for auth flow",
             description="Cover login, signup, token refresh, and logout with Jest + React Testing Library.",
             assigned_to=SR_ID, created_by=SR_ID,
             status=TaskStatus.TODO, priority=TaskPriority.MEDIUM,
             due_date=future(days=18),
             created_at=ago(days=3), updated_at=ago(days=3)),

        # IN_PROGRESS
        Task(id=uid(), project_id=PROJ_MOB_ID,
             title="Redesign onboarding screens",
             description="New 4-step onboarding with illustrations, progress indicator, and skip option.",
             assigned_to=SR_ID, created_by=AK_ID,
             status=TaskStatus.IN_PROGRESS, priority=TaskPriority.MEDIUM,
             due_date=future(days=6),
             created_at=ago(days=6), updated_at=ago(hours=4)),
        Task(id=uid(), project_id=PROJ_MOB_ID,
             title="Migrate state to Zustand",
             description="Replace Redux with Zustand for simpler state management. Migrate auth, tasks, and settings stores.",
             assigned_to=MJ_ID, created_by=AK_ID,
             status=TaskStatus.IN_PROGRESS, priority=TaskPriority.LOW,
             due_date=future(days=8),
             created_at=ago(days=5), updated_at=ago(hours=6)),

        # COMPLETED
        Task(id=uid(), project_id=PROJ_MOB_ID,
             title="Audit current app performance",
             description="Run Lighthouse audit, identify slow screens, measure JS bundle size.",
             assigned_to=AK_ID, created_by=AK_ID,
             status=TaskStatus.COMPLETED, priority=TaskPriority.HIGH,
             due_date=ago(days=5),
             created_at=ago(days=10), updated_at=ago(days=5)),
        Task(id=uid(), project_id=PROJ_MOB_ID,
             title="Fix memory leak in chat screen",
             description="WebSocket connections were not cleaned up on unmount. Added proper cleanup in useEffect.",
             assigned_to=MJ_ID, created_by=MJ_ID,
             status=TaskStatus.COMPLETED, priority=TaskPriority.HIGH,
             due_date=ago(days=3),
             created_at=ago(days=8), updated_at=ago(days=3)),
    ]
    db.add_all(mob_tasks)

    #  API Integration Tasks 
    api_tasks = [
        # TODO
        Task(id=uid(), project_id=PROJ_API_ID,
             title="Document all API endpoints",
             description="Write OpenAPI/Swagger docs for every endpoint including request/response schemas and error codes.",
             assigned_to=PM_ID, created_by=AK_ID,
             status=TaskStatus.TODO, priority=TaskPriority.MEDIUM,
             due_date=future(days=12),
             created_at=ago(days=4), updated_at=ago(days=4)),
        Task(id=uid(), project_id=PROJ_API_ID,
             title="Implement rate limiting",
             description="Add rate limiting middleware: 5 req/min on auth, 100 req/min per user on all other endpoints.",
             assigned_to=MJ_ID, created_by=AK_ID,
             status=TaskStatus.TODO, priority=TaskPriority.HIGH,
             due_date=future(days=7),
             created_at=ago(days=3), updated_at=ago(days=3)),

        # IN_PROGRESS
        Task(id=uid(), project_id=PROJ_API_ID,
             title="Build payment gateway webhook handler",
             description="Handle Stripe webhook events: payment_intent.succeeded, subscription.updated, invoice.payment_failed.",
             assigned_to=AK_ID, created_by=AK_ID,
             status=TaskStatus.IN_PROGRESS, priority=TaskPriority.HIGH,
             due_date=future(days=5),
             created_at=ago(days=5), updated_at=ago(hours=2)),
        Task(id=uid(), project_id=PROJ_API_ID,
             title="Set up CRM sync pipeline",
             description="Bi-directional sync between our users table and Salesforce contacts via their REST API.",
             assigned_to=PM_ID, created_by=PM_ID,
             status=TaskStatus.IN_PROGRESS, priority=TaskPriority.MEDIUM,
             due_date=future(days=9),
             created_at=ago(days=4), updated_at=ago(hours=8)),

        # COMPLETED
        Task(id=uid(), project_id=PROJ_API_ID,
             title="Set up FastAPI project structure",
             description="Initialize project with routers, models, schemas, middleware, and database configuration.",
             assigned_to=AK_ID, created_by=AK_ID,
             status=TaskStatus.COMPLETED, priority=TaskPriority.HIGH,
             due_date=ago(days=4),
             created_at=ago(days=7), updated_at=ago(days=4)),
        Task(id=uid(), project_id=PROJ_API_ID,
             title="Configure JWT authentication",
             description="Implement signup, login, token generation, and middleware for protected routes.",
             assigned_to=MJ_ID, created_by=AK_ID,
             status=TaskStatus.COMPLETED, priority=TaskPriority.HIGH,
             due_date=ago(days=2),
             created_at=ago(days=6), updated_at=ago(days=2)),
    ]
    db.add_all(api_tasks)
    db.commit()

    #  Activity Logs 
    print(" Creating activity logs...")

    activities = [
        #  Website Redesign activities (most recent first in display) 
        ActivityLog(id=uid(), user_id=SR_ID, project_id=PROJ_WEB_ID,
                    action="assigned", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Sneha R.", "task_title": "Mobile responsive breakpoints", "assigned_to": "Priya M."}),
                    created_at=ago(minutes=14)),
        ActivityLog(id=uid(), user_id=PM_ID, project_id=PROJ_WEB_ID,
                    action="priority_changed", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Priya M.", "task_title": "Build component library in Figma", "from": "Medium", "to": "High"}),
                    created_at=ago(hours=1)),
        ActivityLog(id=uid(), user_id=AK_ID, project_id=PROJ_WEB_ID,
                    action="created", entity_type="project", entity_id=PROJ_WEB_ID,
                    changes=json.dumps({"username": "Arjun K.", "project_name": "Website Redesign"}),
                    created_at=ago(days=1)),
        ActivityLog(id=uid(), user_id=SR_ID, project_id=PROJ_WEB_ID,
                    action="status_changed", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Sneha R.", "task_title": "Build component library in Figma", "old_status": "TODO", "new_status": "IN_PROGRESS"}),
                    created_at=ago(hours=3)),
        ActivityLog(id=uid(), user_id=AK_ID, project_id=PROJ_WEB_ID,
                    action="created", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Arjun K.", "task_title": "Set up analytics tracking"}),
                    created_at=ago(days=3)),
        ActivityLog(id=uid(), user_id=AK_ID, project_id=PROJ_WEB_ID,
                    action="added", entity_type="member", entity_id=uid(),
                    changes=json.dumps({"username": "Arjun K.", "member_name": "Priya M.", "email": "priya@techcorp.com"}),
                    created_at=ago(days=12)),
        ActivityLog(id=uid(), user_id=AK_ID, project_id=PROJ_WEB_ID,
                    action="added", entity_type="member", entity_id=uid(),
                    changes=json.dumps({"username": "Arjun K.", "member_name": "Sneha R.", "email": "sneha@techcorp.com"}),
                    created_at=ago(days=13)),
        ActivityLog(id=uid(), user_id=SR_ID, project_id=PROJ_WEB_ID,
                    action="updated", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Sneha R.", "task_title": "Design color palette and typography", "field": "description"}),
                    created_at=ago(days=9)),
        ActivityLog(id=uid(), user_id=PM_ID, project_id=PROJ_WEB_ID,
                    action="status_changed", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Priya M.", "task_title": "Create wireframes for all pages", "old_status": "IN_PROGRESS", "new_status": "COMPLETED"}),
                    created_at=ago(days=7)),
        ActivityLog(id=uid(), user_id=AK_ID, project_id=PROJ_WEB_ID,
                    action="status_changed", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Arjun K.", "task_title": "Set up Vite + React project", "old_status": "IN_PROGRESS", "new_status": "COMPLETED"}),
                    created_at=ago(days=10)),

        #  Mobile App v2 activities 
        ActivityLog(id=uid(), user_id=SR_ID, project_id=PROJ_MOB_ID,
                    action="assigned", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Sneha R.", "task_title": "Write unit tests for auth flow", "assigned_to": "Sneha R."}),
                    created_at=ago(hours=2)),
        ActivityLog(id=uid(), user_id=MJ_ID, project_id=PROJ_MOB_ID,
                    action="status_changed", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Marcus J.", "task_title": "Fix memory leak in chat screen", "old_status": "IN_PROGRESS", "new_status": "COMPLETED"}),
                    created_at=ago(days=3)),
        ActivityLog(id=uid(), user_id=AK_ID, project_id=PROJ_MOB_ID,
                    action="created", entity_type="project", entity_id=PROJ_MOB_ID,
                    changes=json.dumps({"username": "Arjun K.", "project_name": "Mobile App v2"}),
                    created_at=ago(days=10)),
        ActivityLog(id=uid(), user_id=AK_ID, project_id=PROJ_MOB_ID,
                    action="created", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Arjun K.", "task_title": "Design push notification system"}),
                    created_at=ago(days=5)),
        ActivityLog(id=uid(), user_id=AK_ID, project_id=PROJ_MOB_ID,
                    action="added", entity_type="member", entity_id=uid(),
                    changes=json.dumps({"username": "Arjun K.", "member_name": "Marcus J.", "email": "marcus@techcorp.com"}),
                    created_at=ago(days=8)),

        #  API Integration activities 
        ActivityLog(id=uid(), user_id=AK_ID, project_id=PROJ_API_ID,
                    action="status_changed", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Arjun K.", "task_title": "Configure JWT authentication", "old_status": "IN_PROGRESS", "new_status": "COMPLETED"}),
                    created_at=ago(days=2)),
        ActivityLog(id=uid(), user_id=PM_ID, project_id=PROJ_API_ID,
                    action="created", entity_type="task", entity_id=uid(),
                    changes=json.dumps({"username": "Priya M.", "task_title": "Set up CRM sync pipeline"}),
                    created_at=ago(days=4)),
        ActivityLog(id=uid(), user_id=AK_ID, project_id=PROJ_API_ID,
                    action="created", entity_type="project", entity_id=PROJ_API_ID,
                    changes=json.dumps({"username": "Arjun K.", "project_name": "API Integration"}),
                    created_at=ago(days=7)),
    ]
    db.add_all(activities)
    db.commit()

    #  Task Comments 
    print(" Creating task comments...")
    # Get first few task IDs for comments
    first_tasks = db.query(Task).filter(Task.project_id == PROJ_WEB_ID).limit(3).all()
    if len(first_tasks) >= 3:
        comments = [
            TaskComment(id=uid(), task_id=first_tasks[0].id, user_id=SR_ID,
                        content="I'll start with the hero section copy  can you share the brand guidelines doc?",
                        created_at=ago(days=4)),
            TaskComment(id=uid(), task_id=first_tasks[0].id, user_id=AK_ID,
                        content="Shared in the #design Slack channel. Let's use the new gradient background from the mood board.",
                        created_at=ago(days=4, hours=-1)),
            TaskComment(id=uid(), task_id=first_tasks[1].id, user_id=PM_ID,
                        content="I've drafted descriptions for the first 5 pages. Will finish the rest by tomorrow.",
                        created_at=ago(days=3)),
            TaskComment(id=uid(), task_id=first_tasks[2].id, user_id=AK_ID,
                        content="Make sure to set up custom dimensions for user type (free vs paid) in GA4.",
                        created_at=ago(days=2)),
        ]
        db.add_all(comments)
        db.commit()

    db.close()

    #  Summary 
    print()
    print("" * 50)
    print("    Demo data seeded successfully!")
    print("" * 50)
    print()
    print("  Users created:")
    print(f"     Arjun K.  (Admin)   arjun@techcorp.com")
    print(f"     Sneha R.  (Member)  sneha@techcorp.com")
    print(f"     Priya M.  (Member)  priya@techcorp.com")
    print(f"     Marcus J. (Member)  marcus@techcorp.com")
    print(f"    Password for all: SecurePass@123")
    print()
    print("  Projects created:")
    print(f"     Website Redesign   9 tasks (3 TODO, 3 In Progress, 3 Done)")
    print(f"     Mobile App v2      7 tasks (3 TODO, 2 In Progress, 2 Done)")
    print(f"     API Integration    6 tasks (2 TODO, 2 In Progress, 2 Done)")
    print()
    print("  Activity logs: 18 entries across all projects")
    print("  Task comments: 4 entries")
    print()
    print("  Login as Arjun K. (arjun@techcorp.com) to see the full Admin view.")
    print("  Login as Sneha R. (sneha@techcorp.com) to see the Member view.")
    print()


if __name__ == "__main__":
    seed()
