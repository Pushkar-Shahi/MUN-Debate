// ============================================================
// Login / Signup Page — Authentication Gateway
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Eye, EyeOff, ArrowRight, Sparkles, Globe, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'signup';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = mode === 'login'
        ? await login(email, password)
        : await signup(name, email, password);

      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error || 'Authentication failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred.');
    }
    setIsSubmitting(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />

      <div className="login-container">
        {/* Left Panel — Branding */}
        <div className="login-branding">
          <div className="login-brand-content">
            <div className="login-logo">
              <div className="sidebar-logo-icon" style={{ width: 48, height: 48, fontSize: '1.2rem', borderRadius: 14 }}>
                <Radio size={24} />
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                MUN & Debate Central
              </span>
            </div>

            <h1 className="login-brand-title">
              Your Unified
              <span className="login-brand-accent"> Competition</span>
              <br />Discovery Platform
            </h1>

            <p className="login-brand-desc">
              Track MUN conferences, debate tournaments, Youth Parliament events, and student competitions — all in one intelligent dashboard.
            </p>

            <div className="login-features">
              <div className="login-feature-item">
                <div className="login-feature-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                  <Globe size={18} color="var(--color-accent-primary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>Multi-Source Discovery</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-tertiary)' }}>Events from 15+ platforms, auto-synced</div>
                </div>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                  <Sparkles size={18} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>Smart Deadline Alerts</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-tertiary)' }}>Never miss a registration window again</div>
                </div>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-icon" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                  <Shield size={18} color="#22c55e" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>Personal Pipeline Tracker</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-tertiary)' }}>Save, apply, track, and review outcomes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Auth Form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2 className="login-form-title">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="login-form-subtitle">
                {mode === 'login'
                  ? 'Sign in to access your personal dashboard'
                  : 'Get started with your competition tracking journey'}
              </p>
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-name">Full Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Aarav Sharma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="auth-email">Email Address</label>
                <input
                  id="auth-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-pw-toggle"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary login-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="login-spinner" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="login-switch">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button type="button" onClick={switchMode} className="login-switch-btn">
                    Sign up for free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={switchMode} className="login-switch-btn">
                    Sign in
                  </button>
                </>
              )}
            </div>

            <div className="login-demo-hint">
              <span style={{ fontWeight: 600 }}>Quick start:</span> Sign up with any email to create a demo account instantly.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
