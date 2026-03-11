/**
 * Profile Service
 * Handles public user profile calls (no auth token required).
 */
import API_BASE from './api'

/**
 * Fetch a user's public profile by userId.
 * @param {string} userId
 * @returns {Promise<Object>} profile object
 */
export async function getPublicProfile(userId) {
    const response = await fetch(`${API_BASE}/users/${userId}/profile`)
    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'User not found')
    }

    return data.profile
}
