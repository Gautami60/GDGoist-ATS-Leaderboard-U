/**
 * Leaderboard Service
 * Handles public leaderboard API calls (no auth required).
 */
import API_BASE from './api'

/**
 * Fetch the public leaderboard with optional filters and pagination.
 * @param {{ page?: number, limit?: number, department?: string, graduationYear?: string }} options
 * @returns {Promise<{ entries: Array, totalCount: number }>}
 */
export async function getLeaderboard({ page = 1, limit = 50, department = '', graduationYear = '' } = {}) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    })
    if (department) params.append('department', department)
    if (graduationYear) params.append('graduationYear', String(graduationYear))

    const response = await fetch(`${API_BASE}/leaderboard?${params}`)
    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard data')
    }

    return data
}
