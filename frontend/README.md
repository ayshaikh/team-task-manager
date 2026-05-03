# 🎨 TaskFlow Frontend

The frontend for TaskFlow is a modern, responsive single-page application built with **React** and **Vite**, featuring a clean three-column layout, real-time Kanban boards, and a premium dark-themed UI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## ✨ Key Features
- **Project progression**: Dynamic progress bars calculated from task completion.
- **Unified Navigation**: Sidebar with quick access to projects, personal tasks, and team dashboard.
- **Kanban Board**: Drag-and-drop task management powered by `@hello-pangea/dnd`.
- **Activity Timeline**: Avatar-based activity feed showing real-time updates.
- **Theme Support**: Full support for Light and Dark modes with smooth transitions.

## 🛠 Tech Stack
- **Framework**: React 18+ (Vite)
- **Styling**: Vanilla CSS (Custom Variables & Modern Layouts)
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client

## 📂 Directory Structure
- `src/components/`: Reusable UI components (Sidebar, TopBar, ProjectCard, etc.).
- `src/pages/`: Main page views (Projects, Dashboard, Kanban, Login/Signup).
- `src/styles/`: Global and component-specific CSS files.
- `src/contexts/`: Authentication and Notification contexts.
- `src/utils/`: API configuration and helper functions.
- `src/assets/`: Static images and resources.

## 🔧 Configuration
The frontend communicates with the backend via environment variables defined in `.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```
