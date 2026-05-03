import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export default function Toast() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  // Show the most recent notification
  const latest = notifications[notifications.length - 1];

  return (
    <div className="toast-container">
      {notifications.slice(-3).map((notification) => (
        <div
          key={notification.id}
          className="toast"
          onClick={() => removeNotification(notification.id)}
        >
          <div className="toast-title">
            {notification.type === 'success' && 'Success'}
            {notification.type === 'error' && 'Error'}
            {notification.type === 'info' && 'Notification'}
            {notification.type === 'warning' && 'Warning'}
            {!['success', 'error', 'info', 'warning'].includes(notification.type) && 'Notification'}
          </div>
          <div className="toast-body">{notification.message}</div>
        </div>
      ))}
    </div>
  );
}
