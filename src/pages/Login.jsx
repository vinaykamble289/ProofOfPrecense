import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="card-header text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center bg-accent-primary text-bg-primary rounded-full w-16 h-16 text-2xl font-bold">
                AI
              </div>
            </div>
            <h1 className="card-title">Welcome Back</h1>
            <p className="card-subtitle">Sign in to your Attendance AI account</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="form-error mb-6">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-text-tertiary text-sm">
              Demo Credentials:
            </p>
            <div className="mt-2 p-4 bg-bg-tertiary rounded-md">
              <div className="text-text-secondary text-xs">
                <strong>Teacher:</strong> teacher@example.com (any password)
              </div>
              <div className="text-text-secondary text-xs mt-1">
                <strong>Admin:</strong> admin@example.com (any password)
              </div>
              <div className="text-text-secondary text-xs mt-1">
                <strong>Student:</strong> student@example.com (any password)
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-text-tertiary text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent-primary hover:text-accent-primary/80">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
