import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gdgLogo from '../assets/gdg-logo.png'
import ColorBends from './ColorBends'
import { useLandingAnimations } from '../hooks/useGsapAnimations'

export default function LandingPage() {
  // Initialize GSAP animations
  useLandingAnimations();

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* ColorBends Background - Fixed behind everything */}
      <div className="fixed inset-0 z-0">
        <ColorBends
          colors={["#ff6b35", "#f7c59f", "#8a5cf5", "#00d4ff", "#1a1a2e"]}
          rotation={30}
          speed={0.12}
          scale={0.8}
          frequency={1.2}
          warpStrength={1.0}
          mouseInfluence={0.8}
          parallax={0.4}
          noise={0.08}
          transparent
          autoRotate={3}
        />
        {/* Overlay gradient for better text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(10,10,12,0.3) 0%, rgba(10,10,12,0.5) 50%, rgba(10,10,12,0.7) 100%)'
          }}
        />
      </div>

      {/* Content wrapper - Above background */}
      <div className="relative z-10">
        {/* Header - Minimal, Authoritative */}
        <header
          className="sticky top-0 z-50 glass-effect"
          style={{
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(10, 10, 12, 0.8)'
          }}
        >
          <div className="container-premium">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group hero-animate">
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
              <nav className="flex items-center gap-6 hero-animate">
                <Link
                  to="/login"
                  className="text-small font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary magnetic-btn">
                  Get Started
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section - Clean, Confident */}
        <section className="section-spacing" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
          <div className="container-premium">
            <div className="max-w-3xl mx-auto text-center">
              {/* Headline */}
              <h1
                className="text-display mb-6 hero-animate"
                style={{ color: 'var(--text-primary)' }}
              >
                Your Career Readiness,
                <br />
                <span
                  className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #c9965c 0%, #84592b 50%, #f0b67f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Measured & Improved
                </span>
              </h1>

              {/* Subheadline */}
              <p
                className="text-body-lg mb-10 max-w-xl mx-auto hero-animate"
                style={{ color: 'var(--text-tertiary)' }}
              >
                AI-powered analysis of your resume and portfolio.
                Understand where you stand. Get actionable insights.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center hero-animate">
                <Link
                  to="/register"
                  className="btn-primary magnetic-btn"
                  style={{
                    padding: '14px 32px',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #84592b 0%, #c9965c 100%)',
                    boxShadow: '0 4px 20px rgba(132, 89, 43, 0.4)'
                  }}
                >
                  Start Free Analysis
                </Link>
                <Link
                  to="/leaderboard"
                  className="btn-secondary magnetic-btn"
                  style={{
                    padding: '14px 32px',
                    fontSize: '1rem',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section
          className="py-16 section-animate"
          style={{
            backgroundColor: 'rgba(15, 15, 18, 0.8)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div className="container-premium">
            <div className="flex flex-wrap justify-center gap-12 md:gap-20 text-center">
              <div className="item-animate">
                <div
                  className="text-3xl font-bold mb-2"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #c9965c 0%, #f0b67f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  500+
                </div>
                <div className="text-small" style={{ color: 'var(--text-muted)' }}>
                  Students Analyzed
                </div>
              </div>
              <div className="item-animate">
                <div
                  className="text-3xl font-bold mb-2"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #c9965c 0%, #f0b67f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  AI-Powered
                </div>
                <div className="text-small" style={{ color: 'var(--text-muted)' }}>
                  ATS Analysis
                </div>
              </div>
              <div className="item-animate">
                <div
                  className="text-3xl font-bold mb-2"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #c9965c 0%, #f0b67f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
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
        <section className="section-spacing section-animate">
          <div className="container-premium">
            <div className="max-w-4xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-16 item-animate">
                <p
                  className="text-caption mb-3"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #c9965c 0%, #f0b67f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600
                  }}
                >
                  How It Works
                </p>
                <h2
                  className="text-heading"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Three steps to career clarity
                </h2>
              </div>

              {/* Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {/* Step 1 */}
                <div className="text-center item-animate group">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, rgba(132, 89, 43, 0.15) 0%, rgba(201, 150, 92, 0.1) 100%)',
                      border: '1px solid rgba(132, 89, 43, 0.2)'
                    }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{
                        backgroundImage: 'linear-gradient(135deg, #c9965c 0%, #f0b67f 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
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
                <div className="text-center item-animate group">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, rgba(132, 89, 43, 0.15) 0%, rgba(201, 150, 92, 0.1) 100%)',
                      border: '1px solid rgba(132, 89, 43, 0.2)'
                    }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{
                        backgroundImage: 'linear-gradient(135deg, #c9965c 0%, #f0b67f 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
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
                <div className="text-center item-animate group">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, rgba(132, 89, 43, 0.15) 0%, rgba(201, 150, 92, 0.1) 100%)',
                      border: '1px solid rgba(132, 89, 43, 0.2)'
                    }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{
                        backgroundImage: 'linear-gradient(135deg, #c9965c 0%, #f0b67f 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
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
          className="section-spacing section-animate"
          style={{
            backgroundColor: 'rgba(15, 15, 18, 0.6)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="container-premium">
            <div className="max-w-4xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-16 item-animate">
                <p
                  className="text-caption mb-3"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #c9965c 0%, #f0b67f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600
                  }}
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
                    className="card-interactive group item-animate"
                    style={{
                      background: 'rgba(20, 20, 25, 0.6)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(132, 89, 43, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(132, 89, 43, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(132, 89, 43, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                        style={{
                          background: 'linear-gradient(135deg, rgba(132, 89, 43, 0.15) 0%, rgba(201, 150, 92, 0.08) 100%)',
                          color: '#c9965c'
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
                        className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1"
                        style={{ color: '#c9965c' }}
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
        <section className="section-spacing section-animate">
          <div className="container-premium">
            <div
              className="max-w-2xl mx-auto text-center card-elevated item-animate"
              style={{
                background: 'linear-gradient(135deg, rgba(132, 89, 43, 0.08) 0%, rgba(20, 20, 25, 0.8) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(132, 89, 43, 0.15)',
                padding: '48px'
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
                className="btn-primary magnetic-btn inline-block"
                style={{
                  padding: '16px 40px',
                  fontSize: '1.05rem',
                  background: 'linear-gradient(135deg, #84592b 0%, #c9965c 100%)',
                  boxShadow: '0 4px 30px rgba(132, 89, 43, 0.5)'
                }}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </section>

        {/* Footer - Minimal */}
        <footer
          className="py-8"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(10, 10, 12, 0.9)',
            backdropFilter: 'blur(8px)'
          }}
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
    </div>
  )
}
