import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
const PROJECT_COLORS = ['var(--primary)', 'var(--purple)', 'var(--amber)'];


function NavIcon({ type }) {
  switch (type) {
    case 'layers':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 4.5L7 1.5L13 4.5L7 7.5L1 4.5Z" />
          <path d="M1 7.5L7 10.5L13 7.5" />
          <path d="M1 10.5L7 13.5L13 10.5" />
        </svg>
      );
    case 'grid':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="5" height="5" rx="1" />
          <rect x="8" y="1" width="5" height="5" rx="1" />
          <rect x="1" y="8" width="5" height="5" rx="1" />
          <rect x="8" y="8" width="5" height="5" rx="1" />
        </svg>
      );
    case 'bar-chart':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="7" width="3" height="6" rx="0.5" />
          <rect x="5.5" y="4" width="3" height="9" rx="0.5" />
          <rect x="10" y="1" width="3" height="12" rx="0.5" />
        </svg>
      );
    case 'check-circle':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="6" />
          <path d="M4.5 7L6.5 9L9.5 5" />
        </svg>
      );
    case 'users':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="5" cy="4" r="2.5" />
          <path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" />
          <circle cx="10" cy="4.5" r="1.8" />
          <path d="M10.5 8c1.6 0.5 2.5 2 2.5 4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { projectId } = useParams();

  const NAV_ITEMS = [
    { 
      id: 'projects', 
      label: 'Projects', 
      icon: 'layers', 
      path: '/projects'
    },
    { 
      id: 'board', 
      label: 'Board', 
      icon: 'grid', 
      path: `/projects/${projectId}/board`
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'bar-chart', 
      path: projectId ? `/projects/${projectId}/dashboard` : '/dashboard' 
    },
    { 
      id: 'my-tasks', 
      label: 'My Tasks', 
      icon: 'check-circle', 
      path: projectId ? `/projects/${projectId}/tasks` : '/tasks' 
    },
    { 
      id: 'team', 
      label: 'Team', 
      icon: 'users', 
      path: projectId ? `/projects/${projectId}/team` : '/team' 
    },
  ].filter(item => {
    // Hide 'Board' if not in a project context
    if (item.id === 'board' && !projectId) return false;
    return true;
  });

  // Get projects from localStorage (will be populated when user navigates)
  const [projects, setProjects] = React.useState([]);

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        const sorted = (response.data || []).sort((a, b) => {
          if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
          if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
          return 0;
        });
        setProjects(sorted);
      } catch (err) {
        console.error('Failed to fetch projects for sidebar:', err);
      }
    };
    fetchProjects();
  }, [location.pathname]);

  const isActive = (item) => {
    return location.pathname === item.path;
  };

  const handleNavClick = (item) => {
    navigate(item.path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {/* Logo */}
        <div className="sidebar-logo" onClick={() => navigate('/projects')}>
          <div className="logo-icon">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="0" y="0" width="5" height="5" rx="1" fill="white" />
              <rect x="7" y="0" width="5" height="5" rx="1" fill="white" />
              <rect x="0" y="7" width="5" height="5" rx="1" fill="white" />
              <rect x="7" y="7" width="5" height="5" rx="1" fill="white" />
            </svg>
          </div>
          <span className="logo-text">TaskFlow</span>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          <span className="micro-label" style={{ padding: '0 12px', marginBottom: '4px', display: 'block' }}>
            Workspace
          </span>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${isActive(item) ? 'nav-item--active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              <NavIcon type={item.icon} />
              <span>{item.label}</span>
              {isActive(item) && <div className="nav-active-dot" />}
            </button>
          ))}
        </div>
      </div>

      {/* Projects list */}
      <div className="sidebar-projects">
        <span className="micro-label" style={{ padding: '0 12px', marginBottom: '4px', display: 'block' }}>
          Projects
        </span>
        {projects.map((project, index) => {
          const isActiveProject = location.pathname.includes(project.id);
          const color = PROJECT_COLORS[index % PROJECT_COLORS.length];
          return (
            <button
              key={project.id}
              className={`project-item ${isActiveProject ? 'project-item--active' : ''}`}
              style={{ opacity: project.status === 'COMPLETED' ? 0.5 : 1 }}
              onClick={() => navigate(`/projects/${project.id}/board`)}
            >
              <span 
                className="project-dot" 
                style={{ 
                  backgroundColor: project.status === 'COMPLETED' ? 'var(--text-tertiary)' : color,
                  filter: project.status === 'COMPLETED' ? 'grayscale(1)' : 'none'
                }} 
              />
              <span className="project-name">{project.name}</span>
            </button>
          );
        })}
        <button
          className="project-item project-item--new"
          onClick={() => navigate('/projects')}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>+ New project</span>
        </button>
      </div>
    </aside>
  );
}
