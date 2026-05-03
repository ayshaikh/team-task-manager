import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getInitials } from '../utils/stringUtils';
import NotificationBell from './NotificationBell';

export default function TopBar({ projectName, isLive, onAddTask, onSearch }) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const initials = getInitials(user?.username || 'U');

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-project-name">{projectName || 'TaskFlow'}</span>
        <span className="topbar-status-badge">Active</span>
        <span className="topbar-live">
          <span className="live-dot" />
          <span className="live-text">{isLive !== false ? 'Live' : 'Offline'}</span>
        </span>
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-right">
        <div className="topbar-search">
          <svg className="search-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="5" cy="5" r="4" />
            <path d="M8 8L11 11" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>

        <NotificationBell />

        <button className="theme-toggle-btn" onClick={toggleTheme} title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {isDarkMode ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>

        {onAddTask && (
          <button className="topbar-add-btn" onClick={onAddTask}>
            <span>+</span> Add task
          </button>
        )}

        <div className="topbar-avatar" onClick={handleLogout} title={`${user?.username} — Click to logout`}>
          {initials}
        </div>
      </div>
    </header>
  );
}
