import React, { createContext, useState, useCallback, useContext } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const success = useCallback((message) => {
    return addNotification(message, 'success');
  }, [addNotification]);

  const error = useCallback((message) => {
    return addNotification(message, 'error', 7000);
  }, [addNotification]);

  const info = useCallback((message) => {
    return addNotification(message, 'info');
  }, [addNotification]);

  const warning = useCallback((message) => {
    return addNotification(message, 'warning', 6000);
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
