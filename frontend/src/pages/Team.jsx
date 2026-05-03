import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import TeamMembers from '../components/TeamMembers';
import '../styles/ProjectDetail.css';

export default function Team() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    } else {
      fetchUnifiedTeams();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
      setIsOwner(response.data.owner_id === user?.id);
    } catch (err) {
      console.error('Failed to load project for team view', err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnifiedTeams = async () => {
    try {
      setLoading(true);
      // Fetch all projects to show their respective teams
      const response = await api.get('/projects');
      setProjects(response.data || []);
    } catch (err) {
      console.error('Failed to load unified teams', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="detail-view"><p className="detail-loading">Loading teams...</p></div>;
  }

  return (
    <div className="detail-view">
      <div className="detail-header">
        <div className="detail-header-left">
          <h1>{projectId ? `${project?.name} — Team` : 'Your Project Teams'}</h1>
          <p className="detail-desc">
            {projectId 
              ? 'Manage your team and project permissions' 
              : 'Overview of all teams you are collaborating with'}
          </p>
        </div>
      </div>

      <div className="detail-content" style={{ marginTop: '24px' }}>
        {projectId ? (
          <TeamMembers projectId={projectId} isOwner={isOwner} />
        ) : (
          <div className="unified-teams-list">
            {projects.length === 0 ? (
              <div className="empty-state">You are not part of any teams yet.</div>
            ) : (
              projects.map(p => (
                <div key={p.id} className="unified-team-section" style={{ marginBottom: '40px' }}>
                  <h2 className="unified-team-project-title" style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                    {p.name}
                  </h2>
                  <TeamMembers projectId={p.id} isOwner={p.owner_id === user?.id} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
