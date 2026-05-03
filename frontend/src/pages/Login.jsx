import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const emailValid = EMAIL_REGEX.test(email);
  const formValid = emailValid && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!formValid) {
      if (!emailValid) setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>TaskFlow</h1>
        <h2>Sign in to your workspace</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, email: true }))}
              placeholder="you@example.com"
              className={touched.email && !emailValid ? 'input-error' : ''}
              required
            />
            {touched.email && email && !emailValid && (
              <span className="field-hint field-hint--error">Enter a valid email</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, password: true }))}
              placeholder="Enter your password"
              className={touched.password && !password ? 'input-error' : ''}
              required
            />
          </div>

          <button type="submit" disabled={loading || !formValid} className="btn-primary">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
