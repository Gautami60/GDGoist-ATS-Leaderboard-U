import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Pages — auth
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Onboarding from '../pages/auth/Onboarding'

// Pages — main
import LandingPage from '../pages/LandingPage'
import Dashboard from '../pages/dashboard/Dashboard'
import Leaderboard from '../pages/leaderboard/Leaderboard'
import ProfileEdit from '../pages/profile/ProfileEdit'
import PublicProfile from '../pages/profile/PublicProfile'
import AdminDashboard from '../pages/admin/AdminDashboard'

// UI Components
import Navbar from '../components/ui/Navbar'

export default function AppRoutes() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
            {user && <Navbar />}
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
                <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
                <Route path="/profile/edit" element={user ? <ProfileEdit /> : <Navigate to="/login" />} />
                <Route path="/profile/:userId" element={<PublicProfile />} />
                <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
            </Routes>
        </div>
    )
}
