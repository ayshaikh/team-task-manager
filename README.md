# 🚀 TaskFlow

> A production-ready full-stack web application for collaborative project and task management with role-based access control, real-time updates, and a Kanban board interface.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Railway-brightgreen)](https://impartial-miracle-production-45eb.up.railway.app/api-docs)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue)](https://github.com/ayshaikh/team-task-manager)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🌐 Live Demo

**App URL:**https://impartial-miracle-production-45eb.up.railway.app
**Demo Video:** https://drive.google.com/file/d/1Kdhk9mx0tHDTgffec_6qyry68MR66FKT/view?usp=sharing

### Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | arjun@techcorp.com | SecurePass@123 |
| Member | sneha@techcorp.com | SecurePass@123 |

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [What Makes This Stand Out](#what-makes-this-stand-out)

---

## Overview

TaskFlow is a production-grade task management workspace designed for modern teams. It provides a unified environment for project tracking, task allocation, and real-time collaboration. The application features a premium dark-themed UI, an intuitive Kanban board, and dynamic project progression tracking.

This project was built to showcase a full-stack implementation of authentication, role-based access control, real-time synchronization, and a highly polished user experience.

---

## ✨ Features

### 📁 Unified Workspace
- **Home Screen Projects**: A dedicated "Projects" tab serves as the primary navigation hub.
- **Categorized Lists**: Active and Completed projects are separated for better focus.
- **Progression Tracking**: Real-time project completion percentages calculated from task statuses.

### ✅ Task Management
- **Visual Kanban Board**: Drag-and-drop workflow management.
- **Contextual View**: Easily switch between a global task list and project-specific boards.
- **Priority & Due Dates**: Smart sorting and visual indicators for urgent work.

### 📊 Live Dashboard
- **Personal Overview**: High-level summary of your own tasks across all projects.
- **Activity Timeline**: Real-time audit trail of team actions (who moved what and when).
- **Overdue Alerts**: Clear visual warnings for tasks past their deadline.

### ⚡ Real-Time & Auth
- **Socket.io Integration**: Instant updates across all connected clients without page refreshes.
- **Secure RBAC**: Strict server-side enforcement of Admin and Member roles.
- **JWT Auth**: Secure session management with persistent login support.

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React.js (Vite) | UI framework |
| Tailwind CSS | Styling |
| React Router v6 | Client-side routing |
| Zustand | State management |
| Axios | HTTP client |
| Socket.io-client | Real-time communication |
| @hello-pangea/dnd | Kanban drag-and-drop |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|-----------|---------|
| Python + FastAPI | Server & REST API |
| PostgreSQL + SQLAlchemy + Alembic | Database & migrations |
| python-jose + passlib[bcrypt] | Authentication |
| python-socketio | WebSocket real-time layer |
| Pydantic | Input validation |
| Python logging (built-in) | Logging & audit trails |
| Swagger / OpenAPI (built into FastAPI) | API documentation (auto-generated) |

### DevOps
| Technology | Purpose |
|-----------|---------|
| Railway | Backend + DB + Frontend hosting |
| GitHub | Version control |
| dotenv | Environment configuration |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                      │
│  Auth Pages │ Dashboard │ Projects │ Kanban Board       │
└────────────────────────┬────────────────────────────────┘
                         │  REST API (Axios)
                         │  WebSocket (Socket.io-client)
┌────────────────────────▼────────────────────────────────┐
│                  FastAPI Server                         │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Routers │→ │Middleware│→ │Pydantic  │             │
│  └──────────┘  └──────────┘  │Validators│             │
│       JWT Auth │ RBAC │ CORS                            │
│                                                         │
│  ┌──────────────────────┐  ┌─────────────────┐         │
│  │   Socket.io Server   │  │   Swagger Docs  │         │
│  └──────────────────────┘  └─────────────────┘         │
└────────────────────────┬────────────────────────────────┘
                         │  SQLAlchemy ORM
┌────────────────────────▼────────────────────────────────┐
│              SQLite Database (Local Dev)                 │
│  Users │ Projects │ Tasks │ ProjectMembers │ ActivityLog │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄 Database Schema

### Users
```
id            UUID (PK)
username      String (unique)
email         String (unique)
passwordHash  String
role          Enum: ADMIN | MEMBER
createdAt     DateTime
updatedAt     DateTime
```

### Projects
```
id            UUID (PK)
name          String
description   Text
ownerId       UUID → Users.id
status        Enum: ACTIVE | COMPLETED
createdAt     DateTime
updatedAt     DateTime
```

### ProjectMembers
```
id            UUID (PK)
projectId     UUID → Projects.id
userId        UUID → Users.id
role          Enum: ADMIN | MEMBER
joinedAt      DateTime
```

### Tasks
```
id            UUID (PK)
projectId     UUID → Projects.id
title         String
description   Text
assignedTo    UUID → Users.id
createdBy     UUID → Users.id
status        Enum: TODO | IN_PROGRESS | COMPLETED
priority      Enum: LOW | MEDIUM | HIGH
dueDate       DateTime
createdAt     DateTime
updatedAt     DateTime
```

### TaskComments
```
id            UUID (PK)
taskId        UUID → Tasks.id  (CASCADE DELETE)
userId        UUID → Users.id
content       Text
createdAt     DateTime
```

### ActivityLogs
```
id            UUID (PK)
userId        UUID → Users.id
action        String  (created | updated | assigned | deleted)
entityType    String  (task | project)
entityId      UUID
changes       JSON    { field, from, to }
createdAt     DateTime
```

---

## 📡 API Reference

Full interactive documentation is available at `/api-docs` on the live app.

### Authentication
```
POST   /api/auth/signup          Register new user
POST   /api/auth/login           Login → returns JWT
GET    /api/auth/me              Get current user (auth required)
POST   /api/auth/refresh         Refresh access token
```

### Projects
```
GET    /api/projects             List user's projects
POST   /api/projects             Create project
GET    /api/projects/:id         Get project details
PUT    /api/projects/:id         Update project (Admin only)
DELETE /api/projects/:id         Delete project (Admin only)

GET    /api/projects/:id/members           List project members
POST   /api/projects/:id/members           Add member (Admin only)
DELETE /api/projects/:id/members/:userId   Remove member (Admin only)
```

### Tasks
```
GET    /api/projects/:pid/tasks            List project tasks (with filters)
POST   /api/projects/:pid/tasks            Create task
GET    /api/projects/:pid/tasks/:id        Get task details
PUT    /api/projects/:pid/tasks/:id        Update task
DELETE /api/projects/:pid/tasks/:id        Delete task (creator or Admin)
PATCH  /api/projects/:pid/tasks/:id/status Update status only
```

### Dashboard
```
GET    /api/dashboard            Summary: assigned tasks, overdue, project stats
GET    /api/dashboard/activity   Recent activity feed (paginated)
```

### Query Params for Task Filtering
```
GET /api/projects/:pid/tasks?status=TODO&priority=HIGH&assignee=userId&dueDate=2026-05-01&search=keyword
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL (local or cloud)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/[your-username]/team-task-manager
cd team-task-manager
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=sqlite:///./taskmanager.db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
ENVIRONMENT=development
PORT=8000
CLIENT_URL=http://localhost:5173
```

Run the server:
```bash
python main.py
```

Backend runs at: `http://localhost:8000`  
API Docs at: `http://localhost:8000/docs` *(auto-generated by FastAPI)*

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## ☁️ Deployment (Railway)

### Step 1 — Push to GitHub
```bash
git add .
git commit -m "initial commit"
git push origin main
```

### Step 2 — Create Railway Project
1. Go to [railway.app](https://railway.app) → New Project
2. Select **Deploy from GitHub repo**
3. Choose your repository

### Step 3 — Set Environment Variables
In Railway → your backend service → Variables:
```
JWT_SECRET         your_secret_key
ENVIRONMENT        production
PORT               8000
CLIENT_URL         https://your-frontend.up.railway.app
```

### Step 4 — Deploy
Railway will automatically detect the Python backend and run `python main.py`

### Step 6 — Deploy Frontend
Deploy frontend as a separate Railway service or on Vercel.  
Set `VITE_API_URL` to your Railway backend URL.

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── main.py                      # Entry point (FastAPI app + Socket.io mount)
│   ├── routers/
│   │   ├── auth.py                  # /api/auth/*
│   │   ├── projects.py              # /api/projects/*
│   │   ├── tasks.py                 # /api/projects/:pid/tasks/*
│   │   └── dashboard.py             # /api/dashboard/*
│   ├── middleware/
│   │   ├── auth.py                  # JWT verification
│   │   └── rbac.py                  # Role-based access checks
│   ├── models/
│   │   └── models.py                # SQLAlchemy table models
│   ├── schemas/
│   │   └── schemas.py               # Pydantic schemas (validation)
│   ├── database.py                  # DB connection (SQLAlchemy)
│   ├── sockets/
│   │   └── socket_handler.py        # python-socketio events
│   ├── alembic/                     # DB migrations (replaces prisma migrate)
│   │   └── versions/
│   ├── utils/
│   │   ├── logger.py                # Python logging
│   │   └── activity_log.py          # Audit trail helper
│   ├── alembic.ini
│   ├── .env.example
│   ├── requirements.txt             # replaces package.json
│   └── server.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/         # Login, Signup forms
│   │   │   ├── Projects/     # ProjectCard, ProjectForm
│   │   │   ├── Tasks/        # TaskCard, TaskForm, TaskDetail
│   │   │   ├── Kanban/       # KanbanBoard, KanbanColumn
│   │   │   ├── Dashboard/    # Stats, ActivityFeed, OverdueTasks
│   │   │   └── Shared/       # Navbar, Sidebar, Modal, Toast
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   └── NotFound.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useTasks.js
│   │   │   └── useSocket.js
│   │   ├── store/
│   │   │   └── useStore.js   # Zustand store
│   │   ├── utils/
│   │   │   └── api.js        # Axios instance with interceptors
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## 💡 What Makes This Stand Out

### 1. Server-Side RBAC on Every Endpoint
Role checks aren't just UI-level hidden buttons. Every sensitive endpoint runs through `rbac.js` middleware that verifies the user's project role from the database before proceeding.

### 2. Real-Time Kanban with Socket.io
When any user moves a task card or gets assigned a task, all connected teammates see the update instantly — no polling, no refresh required.

### 3. Audit Activity Feed
Every action (task created, assigned, status changed) is written to `ActivityLogs`. The dashboard surfaces a live timeline of team activity, which is a level of transparency most assessment projects skip entirely.

### 5. Unified Workspace Experience
The app seamlessly transitions between a **Global View** (aggregating all projects/tasks) and a **Project-Specific View**. The Sidebar, Right Panel, and Dashboard all adapt dynamically to the context, providing a clutter-free experience that prioritizes the user's current focus.

### 6. Swagger API Documentation
Every endpoint is documented with request/response schemas at `/api-docs`. This signals production-grade thinking and makes testing and handover significantly easier.

### 5. Zod Validation on All Inputs
Input validation isn't scattered across controllers — it runs as middleware using Zod schemas, giving consistent, typed error responses across the entire API.

### 6. Clean Separation of Concerns
Controllers handle logic. Routes handle mapping. Middleware handles cross-cutting concerns (auth, RBAC, validation). Nothing bleeds into the wrong layer.

---

## 📄 License

MIT — free to use, fork, and extend.

---

## 👤 Author

**[Ayyan Shaikh]**  
📧 [connect.ayyanshaikh@gmail.com]  
🐙 [github.com/ayshaikh](https://github.com/ayshaikh)  
💼 [https://www.linkedin.com/in/ayyan-shaikh](https://www.linkedin.com/in/ayyan-shaikh)

---

> Built as part of a full-stack engineering assessment. Deployed live on Railway.
