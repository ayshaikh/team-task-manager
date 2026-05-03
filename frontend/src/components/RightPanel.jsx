import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { getInitials } from '../utils/stringUtils';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';

const ACTION_COLORS = {
  status_changed: 'var(--primary)',
  created: 'var(--primary)',
  updated: 'var(--primary)',
  moved: 'var(--primary)',
  added: 'var(--purple)',
  assigned: 'var(--purple)',
  removed: 'var(--red)',
  deleted: 'var(--red)',
  priority_changed: 'var(--amber)',
};

const MEMBER_AVATARS = [
  { initials: 'AK', bg: 'var(--purple-light)', color: 'var(--purple-dark)' },
  { initials: 'SR', bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
  { initials: 'PM', bg: 'var(--amber-light)', color: 'var(--amber-dark)' },
];

const STATUS_LABELS = {
  TODO: 'To do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 172800000) return 'Yesterday';
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString();
}

function parseChanges(activity) {
  if (typeof activity.changes === 'string') {
    try {
      return JSON.parse(activity.changes || '{}');
    } catch {
      return {};
    }
  }
  return activity.changes || {};
}

function formatActionText(activity) {
  const changes = parseChanges(activity);
  const action = activity.action;
  
  // Extract actor name with multiple fallback layers
  const actorName = activity.user?.username || changes.username || '??';
  const actor = getInitials(actorName);
  
  // Extract task title
  const taskTitle = changes.task_title ? `'${changes.task_title}'` : 'a task';
  
  // Extract member name
  const memberName = changes.member_name || changes.username || activity.user?.username || 'a member';
  const projectName = changes.project_name ? `'${changes.project_name}'` : 'the project';

  switch (action) {
    case 'created':
      if (activity.entity_type === 'project') return `${actor} created ${projectName}`;
      return `${actor} created ${taskTitle}`;
    case 'updated':
      return `${actor} updated ${taskTitle}`;
    case 'deleted':
      return `${actor} deleted ${taskTitle}`;
    case 'status_changed': {
      const to = STATUS_LABELS[changes.new_status] || changes.new_status?.replace('_', ' ');
      return to ? `${actor} moved ${taskTitle} to ${to}` : `${actor} moved ${taskTitle}`;
    }
    case 'assigned': {
      const assignedTo = changes.assigned_to || memberName;
      return assignedTo ? `${actor} assigned ${taskTitle} to ${assignedTo}` : `${actor} assigned ${taskTitle}`;
    }
    case 'added':
      if (activity.entity_type === 'member' || activity.entity_type === 'projectmember') {
        return `${actor} added ${memberName} to the project`;
      }
      return `${actor} added ${taskTitle} to the project`;
    case 'removed':
      return `${actor} removed ${memberName} from the project`;
    case 'priority_changed': {
      const to = changes.to || changes.new_priority;
      return to ? `${actor} set ${taskTitle} priority to ${to}` : `${actor} changed priority on ${taskTitle}`;
    }
    default:
      return `${actor} ${action} ${activity.entity_type || 'item'}`;
  }
}

function getActorInitials(activity) {
  const changes = parseChanges(activity);
  return getInitials(activity.user?.username || changes.username || '??');
}

export default function RightPanel() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { on, off } = useSocket(user?.id, projectId);
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch activities
        try {
          const actRes = await api.get(`/projects/${projectId}/activities`, {
            params: { limit: 10 }
          });
          setActivities(actRes.data || []);
        } catch {
          setActivities([]);
        }

        // Fetch project members
        try {
          const projRes = await api.get(`/projects/${projectId}`);
          const membersList = projRes.data?.project_members || [];
          setMembers(membersList);

          // Build user lookup map
          const map = {};
          membersList.forEach(m => {
            if (m.user) {
              map[m.user_id] = m.user;
            }
          });
          setUserMap(map);
        } catch {
          setMembers([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Real-time updates
  useEffect(() => {
    if (!projectId) return;

    const handleRefresh = () => {
      // Re-fetch activities
      api.get(`/projects/${projectId}/activities`, { params: { limit: 10 } })
        .then(res => setActivities(res.data || []))
        .catch(() => {});
    };

    on('task_created', handleRefresh);
    on('task_updated', handleRefresh);
    on('task_status_changed', handleRefresh);
    on('task_deleted', handleRefresh);

    return () => {
      off('task_created', handleRefresh);
      off('task_updated', handleRefresh);
      off('task_status_changed', handleRefresh);
      off('task_deleted', handleRefresh);
    };
  }, [projectId, on, off]);

  return (
    <aside className="right-panel">
      {/* Activity Feed */}
      <div className="right-section right-section--activity">
        <h4 className="right-section-title">Activity</h4>
        {loading ? (
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', padding: '8px 0' }}>Loading...</p>
        ) : activities.length === 0 ? (
          <div className="right-empty-state">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v4l2.5 2.5" />
            </svg>
            <span>Activity will appear here as the team works</span>
          </div>
        ) : (
          <div className="activity-timeline">
            {activities.slice(0, 8).map((activity, index, array) => {
              const dotColor = ACTION_COLORS[activity.action] || 'var(--text-tertiary)';
              const actorInitials = getActorInitials(activity);

              return (
                <div key={activity.id} className="timeline-item">
                  <div className="timeline-marker">
                    <div className="timeline-avatar" style={{ backgroundColor: dotColor }}>
                      {actorInitials}
                    </div>
                    {index < array.length - 1 && <div className="timeline-connector" />}
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-action">{formatActionText(activity)}</span>
                    <span className="timeline-time">{formatTime(activity.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="right-section right-section--members">
        <h4 className="right-section-title">Members</h4>
        <div className="members-list-compact">
          {members.length === 0 ? (
            <div className="right-empty-state">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                <circle cx="7" cy="6" r="3" />
                <path d="M1 16c0-3 2.7-5 6-5s6 2 6 5" />
                <circle cx="14" cy="7" r="2" />
                <path d="M15 11c2 0.5 4 2 4 5" />
              </svg>
              <span>Invite your team to get started</span>
            </div>
          ) : (
            members.map((member, index) => {
              const isAdmin = member.role === 'ADMIN';
              const username = member.user?.username || 'Unknown';
              const initials = getInitials(username);

              // Consistent avatar colors based on initials
              const avatarColors = [
                { bg: 'var(--purple-light)', color: 'var(--purple-dark)' },
                { bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
                { bg: 'var(--amber-light)', color: 'var(--amber-dark)' },
                { bg: 'var(--red-light)', color: 'var(--red)' },
              ];
              const avatar = avatarColors[index % avatarColors.length];

              return (
                <div key={member.id} className="member-row">
                  <div
                    className="member-avatar-sm"
                    style={{ backgroundColor: avatar.bg, color: avatar.color }}
                  >
                    {initials}
                  </div>
                  <span className="member-name-sm">{username}</span>
                  <span
                    className={`member-tag ${isAdmin ? 'member-tag--admin' : 'member-tag--member'}`}
                  >
                    {isAdmin ? 'Admin' : 'Member'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
