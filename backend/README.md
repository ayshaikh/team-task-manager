# ⚙️ TaskFlow Backend

The backend for TaskFlow is a high-performance REST API built with **FastAPI**, featuring real-time updates via **Socket.io** and robust **Role-Based Access Control (RBAC)**.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Virtual environment (recommended)

### Installation
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
5. Run the server:
   ```bash
   python main.py
   ```

## 🏗 Architecture
- **Framework**: FastAPI (Asynchronous Python)
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **ORM**: SQLAlchemy
- **Real-time**: Python-Socketio
- **Auth**: JWT with `python-jose` and `passlib[bcrypt]`
- **Validation**: Pydantic

## 📂 Directory Structure
- `main.py`: Entry point and Socket.io initialization.
- `routers/`: API endpoints categorized by resource (Auth, Projects, Tasks, etc.).
- `models/`: SQLAlchemy database models.
- `schemas/`: Pydantic models for request/response validation.
- `utils/`: Security helpers, activity loggers, and general utilities.
- `sockets/`: WebSocket event handlers.

## 📖 API Documentation
Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/api-docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🧪 Seeding Data
To populate the database with realistic demo data:
```bash
python seed_demo_data.py
```
This will clear existing data and create several projects, users, and tasks to showcase the application's features.
