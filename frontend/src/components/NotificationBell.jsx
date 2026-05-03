import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to clear notification', err);
    }
  };

  const clearAll = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear all notifications', err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.link) navigate(n.link);
    setIsOpen(false);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notif-container" ref={dropdownRef}>
      <button 
        className={`notif-bell ${unreadCount > 0 ? 'notif-bell--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button className="notif-clear-all" onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>
          <div className="notif-list">
            {loading && notifications.length === 0 ? (
              <div className="notif-empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">No notifications</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`notif-item ${!n.is_read ? 'notif-item--unread' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notif-content">
                    <span className="notif-title">{n.title}</span>
                    <span className="notif-message">{n.message}</span>
                    <span className="notif-time">{formatTime(n.created_at)}</span>
                  </div>
                  {!n.is_read && <div className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
