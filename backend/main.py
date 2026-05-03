from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from database import engine, Base
from models.models import User, Project, Task, ProjectMember, TaskComment, ActivityLog
from routers import auth, projects, tasks, activities, notifications
from socketio import ASGIApp
from sockets.events import sio

# Load environment variables
load_dotenv()

# Create all database tables (guarded - don't crash server if DB is unavailable)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    # Import logging lazily to avoid startup ordering issues
    import logging
    logging.getLogger("uvicorn.error").exception("Database initialization failed: %s", e)

# Initialize FastAPI app
app = FastAPI(
    title="Team Task Manager API",
    description="A full-stack task management application with role-based access control",
    version="1.0.0",
    docs_url="/api-docs",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware FIRST, before routes
client_url = os.getenv("CLIENT_URL", "http://localhost:5173")
allowed_origins = [client_url]
if "localhost" not in client_url:
    # Also allow localhost for development
    allowed_origins.append("http://localhost:5173")
    allowed_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(projects.router)
app.include_router(activities.router)
app.include_router(notifications.router)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Team Task Manager API"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Team Task Manager API",
        "docs": "/api-docs",
        "api_version": "1.0.0"
    }

# Wrap FastAPI app with Socket.io for ASGI compatibility
asgi_app = ASGIApp(sio, app, static_files={})

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(asgi_app, host="0.0.0.0", port=port)
