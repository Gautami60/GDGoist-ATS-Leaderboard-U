/**
 * GitHub Service
 * Handles calls to the public GitHub API from the frontend.
 * These are unauthenticated calls to api.github.com — no backend token needed.
 */

/**
 * Fetch a GitHub user's profile.
 * @param {string} username
 * @returns {Promise<Object>} GitHub user object
 */
export async function fetchGitHubUser(username) {
    const response = await fetch(`https://api.github.com/users/${username}`)
    if (!response.ok) {
        throw new Error('GitHub user not found')
    }
    return response.json()
}

/**
 * Fetch a user's repositories sorted by stars.
 * @param {string} username
 * @returns {Promise<Array>} list of repo objects
 */
export async function fetchGitHubRepos(username) {
    const response = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=stars&order=desc`,
    )
    if (!response.ok) {
        throw new Error('Failed to fetch repositories')
    }
    return response.json()
}
