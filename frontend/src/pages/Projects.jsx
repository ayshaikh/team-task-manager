import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../utils/api';
import '../styles/Projects.css';

export default function Projects() {
  const { user } = useAuth();
  const { success, error: showError } = useNotifications();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Project name is required');
      return;
    }

    try {
      await api.post('/projects', {
        name: formData.name,
        description: formData.description || null
      });

      success('Project created successfully');
      setFormData({ name: '', description: '' });
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${projectId}`);
        success('Project deleted');
        fetchProjects();
      } catch (err) {
        showError(err.response?.data?.detail || 'Failed to delete project');
      }
    }
  };

  const PROJECT_COLORS = ['var(--primary)', 'var(--purple)', 'var(--amber)', 'var(--red)'];

  return (
    <div className="projects-view">
      <div className="projects-view-header">
        <h1>Projects</h1>
        <button className="btn-new-project" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New project'}
        </button>
      </div>

      {showForm && (
        <form className="project-create-form" onSubmit={handleCreateProject}>
          <div className="pf-group">
            <label>Project name</label>
            <input
              type="text"
              placeholder="e.g. Website Redesign"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength="255"
              autoFocus
            />
          </div>
          <div className="pf-group">
            <label>Description</label>
            <textarea
              placeholder="What is this project about?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="pf-actions">
            <button type="submit" className="pf-submit">Create project</button>
            <button type="button" className="pf-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="projects-loading">Loading projects...</p>
      ) : projects.length === 0 ? (
        <div className="projects-empty">
          <p>No projects yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="projects-sections">
          {/* Active Projects */}
          {projects.filter(p => p.status !== 'COMPLETED').length > 0 && (
            <div className="projects-section">
              <h2 className="section-title">Active Projects</h2>
              <div className="projects-list">
                {projects.filter(p => p.status !== 'COMPLETED').map((project, index) => {
                  const dotColor = PROJECT_COLORS[index % PROJECT_COLORS.length];
                  return (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      dotColor={dotColor} 
                      onDelete={handleDeleteProject}
                      navigate={navigate}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Projects */}
          {projects.filter(p => p.status === 'COMPLETED').length > 0 && (
            <div className="projects-section" style={{ marginTop: '48px' }}>
              <h2 className="section-title" style={{ opacity: 0.6 }}>Completed Projects</h2>
              <div className="projects-list projects-list--completed">
                {projects.filter(p => p.status === 'COMPLETED').map((project, index) => {
                  return (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      dotColor="var(--text-tertiary)" 
                      onDelete={handleDeleteProject}
                      navigate={navigate}
                      isCompleted={true}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper component for project cards to keep it clean
function ProjectCard({ project, dotColor, onDelete, navigate, isCompleted }) {
  const total = project.total_tasks || 0;
  const completed = project.completed_tasks || 0;
  const inProgress = project.in_progress_tasks || 0;
  
  // Weighted percentage: Completed (100%), In Progress (50%)
  const percentage = total === 0 ? 0 : Math.min(100, Math.round(((completed + (inProgress * 0.5)) / total) * 100));

  return (
    <div className={`project-card ${isCompleted ? 'project-card--completed' : ''}`}>
      <div className="project-card-top">
        <div className="project-card-title">
          <span className="project-color-dot" style={{ backgroundColor: dotColor }} />
          <span className="project-card-name" style={{ opacity: isCompleted ? 0.7 : 1 }}>{project.name}</span>
        </div>
        <span className={`project-status-badge ${project.status?.toLowerCase()}`}>
          {project.status || 'Active'}
        </span>
      </div>
      
      {project.description && (
        <p className="project-card-desc" style={{ opacity: isCompleted ? 0.6 : 1 }}>{project.description}</p>
      )}

      <div className="project-progress-container">
        <div className="project-progress-info">
          <span>Progression</span>
          <span>{percentage}%</span>
        </div>
        <div className="project-progress-bar">
          <div className="project-progress-fill" style={{ width: `${percentage}%`, backgroundColor: isCompleted ? 'var(--text-tertiary)' : 'var(--primary)' }} />
        </div>
      </div>

      <div className="project-card-footer">
        <div className="project-card-meta">
          <span className="project-card-date">
            {isCompleted ? 'Completed' : 'Created'} {new Date(isCompleted ? project.updated_at : project.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="project-card-actions">
          <button className="proj-card-btn proj-card-btn--primary" onClick={() => navigate(`/projects/${project.id}/board`)}>
            Board
          </button>
          <button className="proj-card-btn" onClick={() => navigate(`/projects/${project.id}`)}>
            Details
          </button>
          <button className="proj-card-btn proj-card-btn--danger" onClick={() => onDelete(project.id)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
