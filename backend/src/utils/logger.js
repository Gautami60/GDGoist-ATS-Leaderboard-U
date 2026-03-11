/**
 * Structured Logger
 *
 * Lightweight wrapper around console that adds:
 * - ISO timestamp
 * - Log level prefix
 * - Request context (method + path) when available
 *
 * No external dependencies required.
 */

const { NODE_ENV } = require('../config/config')

function formatMessage(level, message, meta) {
    const ts = new Date().toISOString()
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
    return `${ts} [${level}] ${message}${metaStr}`
}

const logger = {
    info(message, meta) {
        console.log(formatMessage('INFO ', message, meta))
    },

    warn(message, meta) {
        console.warn(formatMessage('WARN ', message, meta))
    },

    error(message, meta) {
        console.error(formatMessage('ERROR', message, meta))
    },

    debug(message, meta) {
        if (NODE_ENV === 'development') {
            console.debug(formatMessage('DEBUG', message, meta))
        }
    },

    /**
     * Log an incoming HTTP request.
     * Call this in route-level middleware or inside route handlers.
     */
    request(req, extra) {
        this.info(`${req.method} ${req.path}`, extra)
    },
}

module.exports = logger
