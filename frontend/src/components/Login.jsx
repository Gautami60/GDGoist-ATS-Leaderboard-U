import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import gdgLogo from '../assets/gdg-logo.png'

export default function Login() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState('student')
  const [authMode, setAuthMode] = useState('login')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Admin registration mode
    if (authMode === 'register' && loginType === 'admin') {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      const result = await register(name, email, password)

      if (result.success) {
        const userRole = result.user?.role || 'student'
        if (userRole !== 'admin') {
          setError('This email is not authorized for admin registration. Please use an institutional email or contact your administrator.')
          setLoading(false)
          return
        }
        navigate('/admin')
      } else {
        setError(result.error)
      }
      setLoading(false)
      return
    }

    // Login mode
    const result = await login(email, password)

    if (result.success) {
      const userRole = result.user?.role || 'student'

      if (loginType === 'admin') {
        if (userRole === 'admin') {
          navigate('/admin')
        } else {
          setError('This email is not authorized for admin access.')
          setLoading(false)
          return
        }
      } else {
        navigate(userRole === 'admin' ? '/admin' : '/dashboard')
      }
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10 animate-fadeUp">
          <Link to="/" className="inline-flex items-center gap-3 mb-8">
            <img
              src={gdgLogo}
              alt="GDG Logo"
              className="h-12 w-12 object-contain opacity-90"
            />
          </Link>

          <h1
            className="text-heading mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {loginType === 'admin'
              ? (authMode === 'register' ? 'Admin Registration' : 'Admin Access')
              : 'Welcome back'}
          </h1>
          <p
            className="text-body"
            style={{ color: 'var(--text-muted)' }}
          >
            {loginType === 'admin'
              ? 'Institutional analytics portal'
              : 'Sign in to your account'}
          </p>
        </div>

        {/* Login Type Toggle */}
        <div
          className="flex p-1 rounded-xl mb-6 animate-fadeUp stagger-1"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <button
            type="button"
            onClick={() => {
              setLoginType('student')
              setAuthMode('login')
              setError('')
            }}
            className="flex-1 py-2.5 px-4 rounded-lg text-small font-medium transition-all"
            style={{
              backgroundColor: loginType === 'student' ? 'var(--bg-elevated)' : 'transparent',
              color: loginType === 'student' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: loginType === 'student' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType('admin')
              setError('')
            }}
            className="flex-1 py-2.5 px-4 rounded-lg text-small font-medium transition-all"
            style={{
              backgroundColor: loginType === 'admin' ? 'var(--bg-elevated)' : 'transparent',
              color: loginType === 'admin' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: loginType === 'admin' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Admin / Organizer
          </button>
        </div>

        {/* Admin Mode Toggle */}
        {loginType === 'admin' && (
          <div className="flex gap-2 mb-6 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login')
                setError('')
              }}
              className="flex-1 py-2.5 rounded-lg text-small font-medium transition-all"
              style={{
                backgroundColor: authMode === 'login' ? 'var(--accent-primary)' : 'transparent',
                color: authMode === 'login' ? 'white' : 'var(--text-tertiary)',
                border: authMode !== 'login' ? '1px solid var(--border-default)' : 'none',
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register')
                setError('')
              }}
              className="flex-1 py-2.5 rounded-lg text-small font-medium transition-all"
              style={{
                backgroundColor: authMode === 'register' ? 'var(--accent-primary)' : 'transparent',
                color: authMode === 'register' ? 'white' : 'var(--text-tertiary)',
                border: authMode !== 'register' ? '1px solid var(--border-default)' : 'none',
              }}
            >
              Register
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="card-elevated animate-fadeUp stagger-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="error-message animate-fadeIn">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Admin Notice */}
            {loginType === 'admin' && (
              <div className="info-message">
                <p className="text-small">
                  <strong>
                    {authMode === 'register' ? 'Admin Registration:' : 'Admin Access:'}
                  </strong>
                  {' '}Only institutional emails are authorized.
                </p>
              </div>
            )}

            {/* Name (Register only) */}
            {authMode === 'register' && (
              <div>
                <label htmlFor="name" className="label-premium">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input-premium"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="label-premium">
                {loginType === 'admin' ? 'Institutional Email' : 'Email'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-premium"
                placeholder={loginType === 'admin' ? 'admin@college.ac.in' : 'you@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label-premium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                required
                className="input-premium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password (Register only) */}
            {authMode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="label-premium">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-premium"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              style={{ padding: '14px' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner-premium" style={{ width: '18px', height: '18px' }} />
                  {authMode === 'register' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                authMode === 'register'
                  ? 'Create Account'
                  : 'Sign in'
              )}
            </button>
          </form>

          <div className="divider" />

          {/* Footer Link */}
          <div className="text-center">
            {loginType === 'student' ? (
              <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium hover:underline"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Sign up
                </Link>
              </p>
            ) : (
              <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                Need admin access?{' '}
                <a
                  href="mailto:admin@oist.edu"
                  className="font-medium hover:underline"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Contact administrator
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-8 text-center animate-fadeIn stagger-3">
          <Link
            to="/"
            className="text-small font-medium inline-flex items-center gap-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}