from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import socketio
from database import engine, Base
from models.models import User, Project, Task, ProjectMember, TaskComment, ActivityLog
from routers import auth, projects, tasks, activities, notifications
from sockets.events import sio

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="TaskFlow API",
    version="1.0.0",
    docs_url="/api-docs",
    openapi_url="/api/openapi.json"
)

# ✅ Add middleware FIRST, before any routes
client_url = os.getenv("CLIENT_URL", "http://localhost:5173")
allowed_origins = [
    client_url,
    "http://localhost:5173",
    "http://localhost:3000",
    "https://healthcheck.railway.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Health check — simple, no DB dependency, responds instantly
@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {
        "message": "Welcome to TaskFlow API",
        "docs": "/api-docs",
        "api_version": "1.0.0"
    }

# Startup event for database initialization (non-blocking)
@app.on_event("startup")
async def startup_event():
    import logging
    import asyncio
    logger = logging.getLogger("uvicorn.error")
    try:
        # Run DB init in thread pool so it doesn't block the event loop
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: Base.metadata.create_all(bind=engine))
        logger.info("Database initialized successfully")
    except Exception as e:
        # Log error but don't crash — app can start and serve requests
        logger.error(f"Database initialization failed: {e}")

# Include routers
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(projects.router)
app.include_router(activities.router)
app.include_router(notifications.router)

# ✅ Mount Socket.io (no stale ASGIApp import)
socket_app = socketio.ASGIApp(sio, socketio_path='socket.io')
app.mount("/socket.io", socket_app)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
