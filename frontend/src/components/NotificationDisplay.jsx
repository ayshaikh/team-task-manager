import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import '../styles/Notifications.css';

export default function NotificationDisplay() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          <div className="notification-content">
            <p>{notification.message}</p>
            <button
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
