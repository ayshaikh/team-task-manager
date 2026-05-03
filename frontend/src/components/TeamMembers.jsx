import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNotifications } from '../contexts/NotificationContext';
import '../styles/TeamMembers.css';

export default function TeamMembers({ projectId, isOwner }) {
  const { info, success, error } = useNotifications();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      setMembers(response.data.project_members || []);
    } catch (err) {
      error('Failed to load team members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      error('Please enter a valid email');
      return;
    }

    try {
      setAdding(true);
      await api.post(`/projects/${projectId}/members`, {}, {
        params: { user_email: newMemberEmail }
      });
      success(`Member ${newMemberEmail} added successfully!`);
      setNewMemberEmail('');
      setShowAddForm(false);
      fetchMembers();
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      success('Team member removed');
      fetchMembers();
    } catch (err) {
      error('Failed to remove member');
    }
  };

  if (loading) {
    return <div className="team-members-container">Loading...</div>;
  }

  return (
    <div className="team-members-container">
      <div className="team-members-header">
        <h3>Team Members ({members.length})</h3>
        {isOwner && (
          <button 
            className="btn-add-member"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Member'}
          </button>
        )}
      </div>

      {showAddForm && isOwner && (
        <form className="add-member-form" onSubmit={handleAddMember}>
          <input
            type="email"
            placeholder="Enter member email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            disabled={adding}
            required
          />
          <button type="submit" disabled={adding}>
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>
      )}

      <div className="members-list">
        {members.length === 0 ? (
          <p className="no-members">No team members yet</p>
        ) : (
          members.map(member => (
            <div key={member.id} className="member-card">
              <div className="member-info">
                <p className="member-name">{member.user?.username || 'Unknown'}</p>
                <p className="member-email">{member.user?.email}</p>
              </div>
              <div className="member-actions">
                <span className="member-role">{member.role}</span>
                {isOwner && member.user?.id && (
                  <button
                    className="btn-remove-member"
                    onClick={() => handleRemoveMember(member.user.id)}
                    title="Remove member"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
