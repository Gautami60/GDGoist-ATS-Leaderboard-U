/**
 * Environment Variable Validator
 *
 * Called at startup to fail fast if required environment variables
 * are missing or have insecure default values.
 *
 * Required (crash on missing):
 *   - MONGO_URI
 *   - JWT_SECRET (must NOT be 'changeme' in production)
 *
 * Required for features (warn on missing):
 *   - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET
 *   - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 *   - ATS_SERVICE_URL
 *
 * Optional with sane defaults:
 *   - PORT (4000)
 *   - NODE_ENV (development)
 *   - JWT_EXPIRES_IN (7d)
 */

const logger = require('../utils/logger')

const REQUIRED = ['MONGO_URI', 'JWT_SECRET']

const FEATURE_VARS = [
    { group: 'AWS/S3', vars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET'] },
    { group: 'GitHub OAuth', vars: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'] },
    { group: 'ATS Service', vars: ['ATS_SERVICE_URL'] },
]

function validate() {
    const errors = []

    // Check required variables
    for (const key of REQUIRED) {
        if (!process.env[key]) {
            errors.push(`Missing required environment variable: ${key}`)
        }
    }

    // Check JWT_SECRET is not the insecure default in production
    if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'changeme') {
        errors.push('JWT_SECRET must not be "changeme" in production')
    }

    // Fail fast if required vars are missing
    if (errors.length > 0) {
        for (const err of errors) {
            logger.error(`[Config] ${err}`)
        }
        logger.error('[Config] Server cannot start — fix the above environment variable issues')
        process.exit(1)
    }

    // Warn about missing feature variables
    for (const { group, vars } of FEATURE_VARS) {
        const missing = vars.filter(v => !process.env[v])
        if (missing.length > 0) {
            logger.warn(`[Config] ${group} features may not work — missing: ${missing.join(', ')}`)
        }
    }

    logger.info('[Config] Environment validation passed')
}

module.exports = { validate }
