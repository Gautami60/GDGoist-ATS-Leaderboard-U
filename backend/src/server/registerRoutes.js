/**
 * Route Registration
 *
 * Mounts all routers onto the Express app.
 * The error handler is registered last so it catches errors from
 * any route.
 */

const authRoutes = require('../routes/authRoutes')
const profileRoutes = require('../routes/profileRoutes')
const resumeRoutes = require('../routes/resumeRoutes')
const leaderboardRoutes = require('../routes/leaderboardRoutes')
const scoreRoutes = require('../routes/scoreRoutes')
const githubRoutes = require('../routes/githubRoutes')
const badgeRoutes = require('../routes/badgeRoutes')
const peerRoutes = require('../routes/peerRoutes')
const skillGapRoutes = require('../routes/skillGapRoutes')
const adminRoutes = require('../routes/adminRoutes')
const errorHandler = require('../middleware/errorHandler')

function registerRoutes(app) {
    // Health / test
    app.get('/health', (_req, res) => res.json({ status: 'ok' }))
    app.get('/test', (_req, res) => res.json({ message: 'Test endpoint working', timestamp: new Date() }))

    // Domain routes
    app.use('/', authRoutes)
    app.use('/', profileRoutes)
    app.use('/', resumeRoutes)
    app.use('/', leaderboardRoutes)
    app.use('/', scoreRoutes)
    app.use('/', githubRoutes)
    app.use('/', badgeRoutes)
    app.use('/', peerRoutes)
    app.use('/', skillGapRoutes)
    app.use('/', adminRoutes)

    // Centralized error handler — must be last
    app.use(errorHandler)
}

module.exports = registerRoutes
