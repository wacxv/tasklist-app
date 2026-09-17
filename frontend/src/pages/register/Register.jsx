import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './register.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const isLongEnough = pwd.length >= 8;

    if (!isLongEnough) return 'Password must be at least 8 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumber) return 'Password must contain at least one number';
    if (!hasSpecial) return 'Password must contain at least one special character';
    
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    // Validate password requirements
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      await api.post('/users/register', { username, email, password });
      
      // Redirect to login page after successful registration
      navigate('/login', { 
        state: { message: 'Registration successful! Please login.' } 
      });
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response.data.message || 'Username or email is already in use.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-grid">
        <div className="register-card">
          <h1>Register</h1>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleRegister} className="register-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength="3"
                maxLength="30"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Min 8 chars: uppercase, lowercase, digit, special"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <small className="password-hint">
                Password must contain: uppercase, lowercase, number, special character
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-register">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="auth-link">
            <p>Already have an account? <a href="/login">Login here</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}