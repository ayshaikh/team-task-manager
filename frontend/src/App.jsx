import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Kanban from './pages/Kanban';
import Team from './pages/Team';
import MyTasks from './pages/MyTasks';
import './index.css';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <ThemeProvider>
          <Routes>
            {/* Auth pages — no shell */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes — wrapped in AppShell */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Projects />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ProjectDetail />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/board"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Kanban />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/team"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Team />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <MyTasks />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/tasks"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <MyTasks />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Team />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/projects" replace />} />

          </Routes>
          </ThemeProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
