import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'teacher'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    try {
      setIsLoading(true);
      const displayName = `${formData.firstName} ${formData.lastName}`;
      await signup(formData.email, formData.password, formData.role, displayName);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(error.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="card-title">Create Account</h1>
            <p className="card-subtitle">Join Attendance AI to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Administrator</option>
                <option value="coordinator">Coordinator</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                required
                minLength={6}
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
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-text-tertiary text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-accent-primary hover:text-accent-primary/80">
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-bg-tertiary rounded-md">
            <h3 className="text-text-primary font-medium mb-2">What you'll get:</h3>
            <ul className="text-text-secondary text-sm space-y-1">
              <li>• AI-powered face recognition attendance</li>
              <li>• Real-time attendance tracking</li>
              <li>• Blockchain-secured records</li>
              <li>• Comprehensive analytics dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
