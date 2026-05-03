import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: 'var(--red)' };
  if (score <= 2) return { level: 2, label: 'Fair', color: 'var(--amber)' };
  if (score <= 3) return { level: 3, label: 'Good', color: 'var(--amber-dark)' };
  return { level: 4, label: 'Strong', color: 'var(--primary)' };
}

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const { signup } = useAuth();

  const emailValid = EMAIL_REGEX.test(email);
  const usernameValid = username.length >= 3;
  const passwordValid = password.length >= 8;
  const confirmValid = password === confirmPassword && confirmPassword.length > 0;
  const formValid = emailValid && usernameValid && passwordValid && confirmValid;

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true, confirmPassword: true });
    setError('');

    if (!usernameValid) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!emailValid) {
      setError('Please enter a valid email address');
      return;
    }
    if (!passwordValid) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!confirmValid) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup(username, email, password);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>TaskFlow</h1>
        <h2>Create your account</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, username: true }))}
              placeholder="Choose a username"
              maxLength={255}
              className={touched.username && !usernameValid ? 'input-error' : ''}
              required
            />
            {touched.username && username && !usernameValid && (
              <span className="field-hint field-hint--error">At least 3 characters</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, password: true }))}
              placeholder="At least 8 characters"
              maxLength={72}
              className={touched.password && !passwordValid ? 'input-error' : ''}
              required
            />
            {password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{ width: `${(strength.level / 4) * 100}%`, backgroundColor: strength.color }}
                  />
                </div>
                <span className="strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
            {touched.password && password && !passwordValid && (
              <span className="field-hint field-hint--error">At least 8 characters</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm-password">Confirm password</label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, confirmPassword: true }))}
              placeholder="Confirm your password"
              maxLength={72}
              className={touched.confirmPassword && !confirmValid ? 'input-error' : ''}
              required
            />
            {touched.confirmPassword && confirmPassword && !confirmValid && (
              <span className="field-hint field-hint--error">Passwords do not match</span>
            )}
          </div>

          <button type="submit" disabled={loading || !formValid} className="btn-primary">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
