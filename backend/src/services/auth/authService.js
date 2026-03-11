/**
 * Auth Service
 *
 * Extracts admin-check helpers from index.js so they can be
 * reused by authRoutes.js and any other module that needs them.
 *
 * No logic changes — verbatim extraction from the monolith.
 */

const config = require('../../config/config')

/**
 * Check if email is in the admin whitelist.
 * Whitelist is configured via ADMIN_EMAILS env var (comma-separated).
 */
function isAdminEmail(email) {
    const whitelist = config.ADMIN_EMAILS
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)
    return whitelist.includes(email.toLowerCase())
}

/**
 * Determine user role based on admin whitelist.
 * Returns 'admin' if whitelisted, 'student' otherwise.
 */
function determineUserRole(email) {
    return isAdminEmail(email) ? 'admin' : 'student'
}

module.exports = { isAdminEmail, determineUserRole }
