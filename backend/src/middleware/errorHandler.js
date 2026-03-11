/**
 * Centralized Error Handler Middleware
 *
 * Catches any error passed to next(err) and returns a consistent
 * JSON response. Must be mounted LAST in the middleware chain.
 *
 * Usage in registerRoutes.js:
 *   app.use(errorHandler)
 */

const logger = require('../utils/logger')

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const status = err.status || err.statusCode || 500
    const message = err.message || 'Internal server error'

    logger.error(`[${req.method}] ${req.path} — ${message}`, {
        status,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    })

    return res.status(status).json({ error: message })
}

module.exports = errorHandler
