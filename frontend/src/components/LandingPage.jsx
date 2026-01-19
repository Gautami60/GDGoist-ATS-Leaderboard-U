import React from 'react'
import { Link } from 'react-router-dom'
import gdgLogo from '../assets/gdg-logo.png'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header - Minimal, Authoritative */}
      <header
        className="sticky top-0 z-50 glass-effect"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="container-premium">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={gdgLogo}
                alt="GDG Logo"
                className="h-8 w-8 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="flex flex-col">
                <span
                  className="text-base font-semibold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ATS Leaderboard
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  GDG on Campus OIST
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                to="/login"
                className="text-small font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
              >
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Clean, Confident */}
      <section className="section-spacing">
        <div className="container-premium">
          <div className="max-w-3xl mx-auto text-center">
            {/* Headline */}
            <h1
              className="text-display mb-6 animate-fadeUp"
              style={{ color: 'var(--text-primary)' }}
            >
              Your Career Readiness,
              <br />
              <span style={{ color: 'var(--accent-primary)' }}>Measured & Improved</span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-body-lg mb-10 max-w-xl mx-auto animate-fadeUp stagger-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              AI-powered analysis of your resume and portfolio.
              Understand where you stand. Get actionable insights.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeUp stagger-2">
              <Link
                to="/register"
                className="btn-primary"
                style={{ padding: '14px 32px', fontSize: '1rem' }}
              >
                Start Free Analysis
              </Link>
              <Link
                to="/leaderboard"
                className="btn-secondary"
                style={{ padding: '14px 32px', fontSize: '1rem' }}
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section
        className="py-12"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div className="container-premium">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            <div className="animate-fadeIn stagger-1">
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--accent-primary)' }}
              >
                500+
              </div>
              <div className="text-small" style={{ color: 'var(--text-muted)' }}>
                Students Analyzed
              </div>
            </div>
            <div className="animate-fadeIn stagger-2">
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--accent-primary)' }}
              >
                AI-Powered
              </div>
              <div className="text-small" style={{ color: 'var(--text-muted)' }}>
                ATS Analysis
              </div>
            </div>
            <div className="animate-fadeIn stagger-3">
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--accent-primary)' }}
              >
                Real-time
              </div>
              <div className="text-small" style={{ color: 'var(--text-muted)' }}>
                Feedback
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Clear Steps */}
      <section className="section-spacing">
        <div className="container-premium">
          <div className="max-w-4xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <p
                className="text-caption mb-3 animate-fadeUp"
                style={{ color: 'var(--accent-primary)' }}
              >
                How It Works
              </p>
              <h2
                className="text-heading animate-fadeUp stagger-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Three steps to career clarity
              </h2>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <div className="text-center animate-fadeUp stagger-2">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: 'rgba(132, 89, 43, 0.08)' }}
                >
                  <span
                    className="text-xl font-bold"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    1
                  </span>
                </div>
                <h3
                  className="text-subheading mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Upload Resume
                </h3>
                <p
                  className="text-small"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Our AI scans your resume against industry standards and ATS requirements
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center animate-fadeUp stagger-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: 'rgba(132, 89, 43, 0.08)' }}
                >
                  <span
                    className="text-xl font-bold"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    2
                  </span>
                </div>
                <h3
                  className="text-subheading mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Get Insights
                </h3>
                <p
                  className="text-small"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Receive a detailed breakdown of strengths, gaps, and improvement areas
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center animate-fadeUp stagger-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: 'rgba(132, 89, 43, 0.08)' }}
                >
                  <span
                    className="text-xl font-bold"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    3
                  </span>
                </div>
                <h3
                  className="text-subheading mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Track Progress
                </h3>
                <p
                  className="text-small"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Monitor your score over time and see how you rank among peers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Minimal Cards */}
      <section
        className="section-spacing"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="container-premium">
          <div className="max-w-4xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <p
                className="text-caption mb-3"
                style={{ color: 'var(--accent-primary)' }}
              >
                Features
              </p>
              <h2
                className="text-heading"
                style={{ color: 'var(--text-primary)' }}
              >
                Everything you need to improve
              </h2>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              {[
                {
                  title: 'ATS Compatibility Score',
                  description: 'Understand how well your resume performs with applicant tracking systems used by 95% of large companies.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                },
                {
                  title: 'GitHub Portfolio Analysis',
                  description: 'Connect your GitHub to showcase real projects. We analyze activity, code quality, and contribution patterns.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  )
                },
                {
                  title: 'Personalized Recommendations',
                  description: 'Actionable insights tailored to your profile. Know exactly what to improve and in what order.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )
                },
                {
                  title: 'Peer Comparison',
                  description: 'See where you stand among other students in your department and graduation year.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )
                }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="card-interactive group"
                >
                  <div className="flex items-start gap-5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        backgroundColor: 'rgba(132, 89, 43, 0.08)',
                        color: 'var(--accent-primary)'
                      }}
                    >
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-body font-semibold mb-1.5"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className="text-small"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {feature.description}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--text-muted)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing">
        <div className="container-premium">
          <div
            className="max-w-2xl mx-auto text-center card-elevated"
            style={{
              background: 'linear-gradient(135deg, rgba(132, 89, 43, 0.04) 0%, transparent 100%)'
            }}
          >
            <h2
              className="text-heading mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Ready to improve your career readiness?
            </h2>
            <p
              className="text-body mb-8"
              style={{ color: 'var(--text-muted)' }}
            >
              Join students who are taking control of their employability journey.
            </p>
            <Link
              to="/register"
              className="btn-primary"
              style={{ padding: '14px 32px', fontSize: '1rem' }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer
        className="py-8"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="container-premium">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src={gdgLogo}
                alt="GDG Logo"
                className="h-6 w-6 object-contain opacity-60"
              />
              <span
                className="text-small"
                style={{ color: 'var(--text-muted)' }}
              >
                ATS Leaderboard · GDG on Campus OIST
              </span>
            </div>
            <p
              className="text-small"
              style={{ color: 'var(--text-muted)' }}
            >
              © 2026 All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
