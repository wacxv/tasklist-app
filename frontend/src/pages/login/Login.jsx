import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import './login.css';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Show success message if redirected from registration
    if (location.state?.message) {
      setSuccess(location.state.message);
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/users/login', { identifier, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.id);
      localStorage.setItem('email', res.data.email);
      localStorage.setItem('username', res.data.username || '');
      navigate('/tasks');
    } catch (err) {
      const status = err.response?.status;
      const message =
        status === 400 || status === 401
          ? 'Invalid email or password'
          : err.response?.data?.message || 'Login failed. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-grid">
        <div className="login-card">
          <h1>Login</h1>
          
          {success && (
            <div className="success-message">{success}</div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="identifier">Username or email</label>
              <input
                id="identifier"
                type="text"
                placeholder="Enter your username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-login">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="auth-link">
            <p>Don't have an account? <a href="/register">Register here</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}