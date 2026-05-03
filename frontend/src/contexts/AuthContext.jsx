import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signup = async (username, email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/signup', {
        username,
        email,
        password,
      });
      const { access_token, user } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return user;
    } catch (err) {
      const message = err.response?.data?.detail || 'Signup failed';
      setError(message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      const { access_token, user } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return user;
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      setError(message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
