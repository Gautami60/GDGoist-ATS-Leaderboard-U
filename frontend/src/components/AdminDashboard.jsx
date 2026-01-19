import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
    const { apiCall } = useAuth()
    const [loading, setLoading] = useState(true)
    const [platformStats, setPlatformStats] = useState(null)
    const [cohorts, setCohorts] = useState([])
    const [atRiskCohorts, setAtRiskCohorts] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        fetchAdminData()
    }, [])

    const fetchAdminData = async () => {
        try {
            setLoading(true)
            setError('')

            const statsRes = await apiCall('/admin/analytics/platform')
            if (statsRes.ok) {
                const data = await statsRes.json()
                setPlatformStats(data)
            }

            const cohortsRes = await apiCall('/admin/analytics/cohorts')
            if (cohortsRes.ok) {
                const data = await cohortsRes.json()
                setCohorts(data.cohorts || [])
            }

            const atRiskRes = await apiCall('/admin/analytics/at-risk')
            if (atRiskRes.ok) {
                const data = await atRiskRes.json()
                setAtRiskCohorts(data.atRiskCohorts || [])
            }

            setLoading(false)
        } catch (err) {
            console.error('Admin data fetch error:', err)
            setError('Failed to load admin analytics')
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                <div className="text-center">
                    <div className="spinner-premium mb-4" style={{ width: '40px', height: '40px' }} />
                    <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                        Loading analytics...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="container-premium py-10">
                {/* Header */}
                <header className="mb-10 animate-fadeUp">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <p
                                className="text-caption mb-2"
                                style={{ color: 'var(--accent-primary)' }}
                            >
                                Admin Dashboard
                            </p>
                            <h1
                                className="text-display"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Platform Analytics
                            </h1>
                        </div>
                        <p
                            className="text-small"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            Privacy-compliant · No PII
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="error-message mb-8 animate-fadeIn">
                        {error}
                    </div>
                )}

                {/* Platform Stats Grid */}
                {platformStats && (
                    <div className="mb-10 animate-fadeUp stagger-1">
                        <h2
                            className="text-caption mb-4"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            Platform Overview
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                label="Total Users"
                                value={platformStats.platform.totalUsers}
                                accent
                            />
                            <StatCard
                                label="Scored Users"
                                value={platformStats.platform.totalScores}
                            />
                            <StatCard
                                label="GitHub Connections"
                                value={platformStats.platform.totalGitHubConnections}
                            />
                            <StatCard
                                label="Engagement Rate"
                                value={`${platformStats.platform.engagementRate}%`}
                            />
                        </div>

                        {/* Average Scores */}
                        <div
                            className="mt-6 pt-6"
                            style={{ borderTop: '1px solid var(--border-subtle)' }}
                        >
                            <h3
                                className="text-caption mb-4"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Platform Averages
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <MiniStatCard
                                    label="Total Score"
                                    value={platformStats.averageScores.total}
                                />
                                <MiniStatCard
                                    label="ATS Score"
                                    value={platformStats.averageScores.ats}
                                />
                                <MiniStatCard
                                    label="GitHub Score"
                                    value={platformStats.averageScores.github}
                                />
                                <MiniStatCard
                                    label="Badges Score"
                                    value={platformStats.averageScores.badges}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* At-Risk Cohorts */}
                {atRiskCohorts.length > 0 && (
                    <div className="mb-10 animate-fadeUp stagger-2">
                        <div className="flex items-center gap-3 mb-4">
                            <h2
                                className="text-caption"
                                style={{ color: 'var(--danger)' }}
                            >
                                At-Risk Cohorts
                            </h2>
                            <span
                                className="badge-danger"
                                style={{ fontSize: '0.6875rem' }}
                            >
                                {atRiskCohorts.length} cohort{atRiskCohorts.length > 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {atRiskCohorts.map((cohort, idx) => (
                                <div
                                    key={idx}
                                    className="card-base"
                                    style={{
                                        backgroundColor: 'var(--danger-bg)',
                                        borderColor: 'rgba(193, 59, 27, 0.12)'
                                    }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <div
                                                className="text-body font-semibold mb-1"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {cohort.cohort.department} · Class of {cohort.cohort.graduationYear}
                                            </div>
                                            <div
                                                className="text-small"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                {cohort.totalStudents} students · Avg: {cohort.averageScore}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div
                                                    className="text-lg font-bold"
                                                    style={{ color: 'var(--danger)' }}
                                                >
                                                    {cohort.developingPercentage}%
                                                </div>
                                                <div
                                                    className="text-small"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    developing
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="mt-3 pt-3 text-small"
                                        style={{
                                            borderTop: '1px solid rgba(193, 59, 27, 0.1)',
                                            color: 'var(--text-tertiary)'
                                        }}
                                    >
                                        💡 {cohort.recommendation}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cohort Analytics */}
                <div className="animate-fadeUp stagger-3">
                    <h2
                        className="text-caption mb-4"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Cohort Breakdown
                    </h2>

                    {cohorts.length === 0 ? (
                        <div className="empty-state card-base">
                            <p style={{ color: 'var(--text-muted)' }}>
                                No cohort data available yet
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cohorts.map((cohort, idx) => (
                                <div
                                    key={idx}
                                    className="card-premium"
                                >
                                    {/* Cohort Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <div>
                                            <h3
                                                className="text-subheading"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {cohort.cohort.department}
                                            </h3>
                                            <p
                                                className="text-small"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                Class of {cohort.cohort.graduationYear} · {cohort.metrics.totalStudents} students
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className="text-2xl font-bold"
                                                style={{ color: 'var(--accent-primary)' }}
                                            >
                                                {cohort.metrics.averageScores.total}
                                            </div>
                                            <div
                                                className="text-small"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                avg score
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score Breakdown */}
                                    <div
                                        className="grid grid-cols-3 gap-4 pb-6 mb-6"
                                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                                    >
                                        <div>
                                            <div
                                                className="text-lg font-semibold"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                {cohort.metrics.averageScores.ats}
                                            </div>
                                            <div
                                                className="text-small"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                ATS
                                            </div>
                                        </div>
                                        <div>
                                            <div
                                                className="text-lg font-semibold"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                {cohort.metrics.averageScores.github}
                                            </div>
                                            <div
                                                className="text-small"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                GitHub
                                            </div>
                                        </div>
                                        <div>
                                            <div
                                                className="text-lg font-semibold"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                {cohort.metrics.averageScores.badges}
                                            </div>
                                            <div
                                                className="text-small"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                Badges
                                            </div>
                                        </div>
                                    </div>

                                    {/* Distribution */}
                                    <div>
                                        <div
                                            className="text-small font-medium mb-3"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            Score Distribution
                                        </div>
                                        <div className="flex gap-3">
                                            <DistributionBadge
                                                label="Developing"
                                                value={cohort.metrics.distribution.developing.percentage}
                                                variant="danger"
                                            />
                                            <DistributionBadge
                                                label="Progressing"
                                                value={cohort.metrics.distribution.progressing.percentage}
                                                variant="warning"
                                            />
                                            <DistributionBadge
                                                label="Advanced"
                                                value={cohort.metrics.distribution.advanced.percentage}
                                                variant="success"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Stat Card Component
function StatCard({ label, value, accent = false }) {
    return (
        <div className="card-base">
            <div
                className="text-3xl font-bold mb-1"
                style={{ color: accent ? 'var(--accent-primary)' : 'var(--text-primary)' }}
            >
                {value}
            </div>
            <div
                className="text-small"
                style={{ color: 'var(--text-muted)' }}
            >
                {label}
            </div>
        </div>
    )
}

// Mini Stat Card
function MiniStatCard({ label, value }) {
    return (
        <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
            <div
                className="text-lg font-semibold mb-0.5"
                style={{ color: 'var(--text-secondary)' }}
            >
                {value}
            </div>
            <div
                className="text-small"
                style={{ color: 'var(--text-muted)' }}
            >
                {label}
            </div>
        </div>
    )
}

// Distribution Badge
function DistributionBadge({ label, value, variant }) {
    const colors = {
        danger: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
        warning: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
        success: { bg: 'var(--success-bg)', color: 'var(--success)' },
    }

    const { bg, color } = colors[variant] || colors.neutral

    return (
        <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: bg }}
        >
            <span
                className="text-sm font-semibold"
                style={{ color }}
            >
                {value}%
            </span>
            <span
                className="text-small"
                style={{ color: 'var(--text-tertiary)' }}
            >
                {label}
            </span>
        </div>
    )
}
