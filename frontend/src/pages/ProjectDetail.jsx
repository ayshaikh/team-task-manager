import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../utils/api';
import TeamMembers from '../components/TeamMembers';
import '../styles/ProjectDetail.css';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { success, error: showError } = useNotifications();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
      setIsOwner(response.data.owner_id === user?.id);
      setFormData({
        name: response.data.name,
        description: response.data.description
      });
    } catch (err) {
      showError('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/projects/${projectId}`, formData);
      setProject(response.data);
      setEditMode(false);
      success('Project updated');
    } catch (err) {
      showError('Failed to update project');
    }
  };

  if (loading) {
    return <div className="detail-view"><p className="detail-loading">Loading...</p></div>;
  }

  if (!project) {
    return <div className="detail-view"><p className="detail-loading">Project not found</p></div>;
  }

  return (
    <div className="detail-view">
      <div className="detail-header">
        <div className="detail-header-left">
          <h1>{project.name}</h1>
          {project.description && <p className="detail-desc">{project.description}</p>}
        </div>
        <div className="detail-header-actions">
          <button className="detail-btn" onClick={() => navigate(`/projects/${projectId}/board`)}>
            View board
          </button>
          {isOwner && !editMode && (
            <button className="detail-btn" onClick={() => setEditMode(true)}>
              Edit
            </button>
          )}
        </div>
      </div>

      {editMode && isOwner && (
        <form className="detail-edit-form" onSubmit={handleUpdateProject}>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Project name"
          />
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            rows="3"
          />
          <div className="detail-form-actions">
            <button type="submit" className="pf-submit">Save</button>
            <button type="button" className="pf-cancel" onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="detail-content">
        <TeamMembers projectId={projectId} isOwner={isOwner} />
      </div>
    </div>
  );
}
