import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

/**
 * Custom hook for Socket.io connection management
 * @param {string} userId - Current user ID
 * @param {string} projectId - Current project ID (optional)
 * @returns {object} - Socket instance and helper methods
 */
export const useSocket = (userId, projectId = null) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;

    // Create socket instance
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('access_token'),
      },
    });

    // Handle connection
    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      setIsConnected(true);
      
      // Join project if specified
      if (projectId) {
        socketRef.current.emit('join_project', {
          user_id: userId,
          project_id: projectId,
        });
      }
    });

    // Handle disconnection
    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      // Clean up on unmount
      if (socketRef.current) {
        if (projectId) {
          socketRef.current.emit('leave_project', {
            user_id: userId,
            project_id: projectId,
          });
        }
        socketRef.current.disconnect();
        setIsConnected(false);
      }
    };
  }, [userId, projectId]);

  // Function to subscribe to events
  const on = useCallback((event, callback) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, callback);
  }, []);

  // Function to emit events
  const emit = useCallback((event, data) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, data);
  }, []);

  // Function to unsubscribe from events — supports both specific and blanket removal
  const off = useCallback((event, callback) => {
    if (!socketRef.current) return;
    if (callback) {
      socketRef.current.off(event, callback);
    } else {
      // Remove all listeners for this event
      socketRef.current.off(event);
    }
  }, []);

  return {
    socket: socketRef.current,
    on,
    emit,
    off,
    isConnected,
  };
};

export default useSocket;
