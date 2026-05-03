import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/ActivityLog.css';

const ACTION_LABELS = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  moved: 'Moved',
  status_changed: 'Status changed',
  added: 'Added',
  removed: 'Removed'
};

const ENTITY_COLORS = {
  Task: 'var(--primary)',
  Project: 'var(--purple)',
  ProjectMember: 'var(--amber)'
};

export default function ActivityLog({ projectId, limit = 20 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, [projectId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fixed: removed double /api prefix — api.js already has /api base URL
      const response = await api.get(`/projects/${projectId}/activities`, {
        params: { limit }
      });
      setActivities(response.data || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('Unable to load activity log');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="activity-log-container"><p className="activity-loading">Loading activities...</p></div>;
  }

  return (
    <div className="activity-log-container">
      <div className="activity-log-header">
        <h3>Activity log</h3>
      </div>

      <div className="activities-timeline">
        {error && <p className="activity-error">{error}</p>}
        {activities.length === 0 ? (
          <p className="no-activities">No activities yet</p>
        ) : (
          activities.map((activity, index) => (
            <div key={activity.id} className="activity-item">
              <div
                className="activity-dot"
                style={{ backgroundColor: ENTITY_COLORS[activity.entity_type] || 'var(--text-tertiary)' }}
              />

              {index !== activities.length - 1 && <div className="activity-line" />}

              <div className="activity-content">
                <div className="activity-header">
                  <span className="activity-action">
                    {ACTION_LABELS[activity.action] || activity.action}
                  </span>
                  <span
                    className="activity-entity"
                    style={{ backgroundColor: (ENTITY_COLORS[activity.entity_type] || 'var(--text-tertiary)') + '20' }}
                  >
                    {activity.entity_type}
                  </span>
                  <span className="activity-time">
                    {formatDate(activity.created_at)}
                  </span>
                </div>

                <p className="activity-description">
                  {activity.action} {activity.entity_type.toLowerCase()}
                </p>

                {activity.changes && Object.keys(activity.changes).length > 0 && (
                  <button
                    className="activity-toggle"
                    onClick={() => setShowDetails(showDetails === activity.id ? null : activity.id)}
                  >
                    {showDetails === activity.id ? 'Hide' : 'Details'}
                  </button>
                )}

                {showDetails === activity.id && (
                  <div className="activity-details">
                    <pre>{JSON.stringify(activity.changes, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
