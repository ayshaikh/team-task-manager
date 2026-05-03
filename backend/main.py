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

# Initialize FastAPI app
app = FastAPI(
    title="Team Task Manager API",
    description="A full-stack task management application with role-based access control",
    version="1.0.0",
    docs_url="/api-docs",
    openapi_url="/api/openapi.json"
)

# Startup event for database initialization
@app.on_event("startup")
async def startup_event():
    import logging
    logger = logging.getLogger("uvicorn.error")
    try:
        # Create all database tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

# Health check endpoint (defined BEFORE socketio mount for priority)
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "TaskFlow API"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to TaskFlow API",
        "docs": "/api-docs",
        "api_version": "1.0.0"
    }

# Add CORS middleware
client_url = os.getenv("CLIENT_URL", "http://localhost:5173")
allowed_origins = [client_url, "http://localhost:5173", "http://localhost:3000"]

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

# Wrap FastAPI app with Socket.io
asgi_app = ASGIApp(sio, app)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    # Note: Use asgi_app here to include Socket.io
    uvicorn.run(asgi_app, host="0.0.0.0", port=port)
