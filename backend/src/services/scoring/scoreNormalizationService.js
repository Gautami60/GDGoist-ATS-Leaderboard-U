/**
 * Score Normalization Service
 *
 * Provides a normalization layer between the raw ATS score (from the
 * Python microservice) and the final leaderboard score stored in the
 * database. This layer can be tuned independently without touching the
 * scoring algorithm in the ATS microservice or scoreService.js.
 *
 * Current implementation: pass-through (returns rawScore unchanged).
 * Add scaling / weighting adjustments here as needed.
 */

const logger = require('../../utils/logger')

/**
 * Normalize a raw ATS score before it is persisted.
 *
 * @param {number} rawScore  - Score received from the Python ATS service (0–100)
 * @param {Object} [options] - Optional context for advanced normalization
 * @param {number} [options.githubScore]  - GitHub component score (0–100)
 * @param {number} [options.badgesScore]  - Badges component score
 * @param {string[]} [options.parsingErrors] - Parsing errors from ATS response
 * @returns {number} Normalized score (0–100)
 */
function normalizeATSScore(rawScore, options = {}) {
    if (typeof rawScore !== 'number' || isNaN(rawScore)) {
        logger.warn('normalizeATSScore received invalid rawScore', { rawScore })
        return 0
    }

    // Clamp to [0, 100] — safety guard
    let score = Math.max(0, Math.min(100, rawScore))

    // ── Future normalization hooks (currently pass-through) ──────────
    // Example: apply a penalty for parsing errors
    // if (options.parsingErrors && options.parsingErrors.length > 0) {
    //   score = score * 0.95
    // }
    //
    // Example: apply scaling for score distribution improvement
    // score = applyScoreCurve(score)
    // ─────────────────────────────────────────────────────────────────

    logger.debug('normalizeATSScore', { rawScore, normalizedScore: score })
    return Math.round(score * 100) / 100
}

module.exports = { normalizeATSScore }
