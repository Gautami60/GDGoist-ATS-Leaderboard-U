/**
 * Semantic Similarity Service
 *
 * Extracted verbatim from index.js.
 * Provides SBERT-based (or heuristic fallback) semantic similarity
 * between two text strings. Used by resumeRoutes.js.
 */

const config = require('../../config/config')
const logger = require('../../utils/logger')

/**
 * Calculate semantic similarity between resume and job description.
 * Tries SBERT service first; falls back to improved heuristic.
 *
 * @param {string} resumeText
 * @param {string} jobDescription
 * @returns {Promise<number>} score 0–1
 */
async function getSemanticSimilarity(resumeText, jobDescription) {
    try {
        const FormData = require('form-data')
        const formData = new FormData()
        formData.append('text1', resumeText.substring(0, 2000))
        formData.append('text2', jobDescription.substring(0, 1000))

        const response = await fetch(`${config.SBERT_SERVICE_URL}/semantic-similarity`, {
            method: 'POST',
            body: formData,
            timeout: 5000,
        })

        if (response.ok) {
            const data = await response.json()
            return data.similarity || 0
        }
    } catch (err) {
        logger.warn('SBERT service unavailable, using improved heuristic', { error: err.message })
    }

    return improvedSemanticHeuristic(resumeText, jobDescription)
}

/**
 * Enhanced semantic analysis with NLP techniques (heuristic fallback).
 * Verbatim from index.js — no logic changes.
 */
function improvedSemanticHeuristic(resumeText, jobDescription) {
    if (!jobDescription) return 0

    const resume = resumeText.toLowerCase()
    const jd = jobDescription.toLowerCase()

    const stopwords = new Set([
        'the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were', 'been', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'is', 'as', 'at',
        'by', 'in', 'of', 'on', 'or', 'to', 'a', 'an', 'be', 'but', 'if', 'it', 'no', 'not', 'so', 'up', 'we',
        'you', 'your', 'he', 'she', 'it', 'they', 'them', 'their', 'which', 'who', 'what', 'when', 'where', 'why',
        'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own',
        'same', 'so', 'than', 'too', 'very', 'just', 'also', 'well', 'even', 'any', 'about', 'after', 'before',
        'between', 'during', 'through', 'throughout', 'within', 'without', 'above', 'below', 'under', 'over',
        'out', 'off', 'up', 'down', 'here', 'there', 'now', 'then', 'today', 'tomorrow', 'yesterday',
    ])

    const extractTerms = (text) =>
        text.match(/\b\w{3,}\b/g)?.filter(w => !stopwords.has(w)) || []

    const extractNGrams = (text, n = 2) => {
        const words = text.split(/\s+/).filter(w => w.length > 2)
        const ngrams = []
        for (let i = 0; i <= words.length - n; i++) {
            ngrams.push(words.slice(i, i + n).join(' '))
        }
        return ngrams
    }

    const jdTerms = extractTerms(jd)
    const resumeTerms = extractTerms(resume)
    const jdBigrams = extractNGrams(jd, 2)
    const resumeBigrams = extractNGrams(resume, 2)
    const jdTrigrams = extractNGrams(jd, 3)
    const resumeTrigrams = extractNGrams(resume, 3)

    if (jdTerms.length === 0) return 0

    // 1. Unigram matching (40%)
    const resumeTermSet = new Set(resumeTerms)
    const matchedTerms = jdTerms.filter(term => resumeTermSet.has(term))
    const unigramScore = (matchedTerms.length / jdTerms.length) * 0.4

    // 2. Bigram matching (30%)
    const resumeBigramSet = new Set(resumeBigrams)
    const matchedBigrams = jdBigrams.filter(bigram => resumeBigramSet.has(bigram))
    const bigramScore = (matchedBigrams.length / Math.max(1, jdBigrams.length)) * 0.3

    // 3. Trigram matching (15%)
    const resumeTrigramSet = new Set(resumeTrigrams)
    const matchedTrigrams = jdTrigrams.filter(trigram => resumeTrigramSet.has(trigram))
    const trigramScore = (matchedTrigrams.length / Math.max(1, jdTrigrams.length)) * 0.15

    // 4. Skill keyword matching (15%)
    const skillKeywords = [
        'javascript', 'python', 'java', 'c++', 'c#', 'typescript', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
        'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'ember', 'backbone',
        'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'laravel', 'rails', 'asp',
        'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'firebase', 'dynamodb', 'cassandra',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'github', 'gitlab', 'jenkins', 'circleci',
        'rest', 'graphql', 'grpc', 'websocket', 'oauth', 'jwt', 'microservices', 'serverless',
        'html', 'css', 'scss', 'sass', 'sql', 'nosql', 'xml', 'json', 'yaml',
        'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
        'agile', 'scrum', 'kanban', 'jira', 'confluence', 'linux', 'unix', 'windows', 'macos',
        'ci/cd', 'devops', 'testing', 'jest', 'mocha', 'pytest', 'selenium', 'cypress',
    ]
    let skillMatches = 0
    for (const skill of skillKeywords) {
        if (jd.includes(skill) && resume.includes(skill)) skillMatches++
    }
    const skillScore = (skillMatches / Math.max(1, skillKeywords.length)) * 0.15

    // 5. Semantic similarity bonus
    const semanticRelations = {
        developer: ['engineer', 'programmer', 'coder', 'architect'],
        frontend: ['ui', 'ux', 'client-side', 'web'],
        backend: ['server-side', 'api', 'database'],
        fullstack: ['full-stack', 'full stack'],
        devops: ['infrastructure', 'deployment', 'cloud'],
        data: ['analytics', 'warehouse', 'science', 'engineering'],
        security: ['cybersecurity', 'encryption', 'authentication'],
        testing: ['qa', 'quality assurance', 'automation'],
        management: ['leadership', 'team lead', 'scrum master'],
        design: ['ux', 'ui', 'figma', 'sketch'],
    }
    let semanticBonus = 0
    for (const [key, values] of Object.entries(semanticRelations)) {
        if (jd.includes(key)) {
            for (const val of values) {
                if (resume.includes(val)) semanticBonus += 0.02
            }
        }
    }

    // 6. Experience level matching
    const experienceLevels = {
        junior: ['entry', 'beginner', 'fresh', 'graduate'],
        mid: ['intermediate', 'experienced', '3-5 years', '5+ years'],
        senior: ['lead', 'principal', '10+ years', 'expert', 'architect'],
        intern: ['internship', 'student', 'trainee'],
    }
    let experienceBonus = 0
    for (const [level, keywords] of Object.entries(experienceLevels)) {
        if (jd.includes(level)) {
            for (const keyword of keywords) {
                if (resume.includes(keyword)) experienceBonus += 0.03
            }
        }
    }

    const finalScore = Math.min(
        1.0,
        unigramScore + bigramScore + trigramScore + skillScore + semanticBonus + experienceBonus,
    )
    return Math.max(0, finalScore)
}

module.exports = { getSemanticSimilarity, improvedSemanticHeuristic }
