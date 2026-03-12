/**
 * Profile Routes
 * GET    /me
 * GET    /me/profile
 * PUT    /me/profile
 * POST   /me/avatar
 * GET    /me/resume
 * GET    /me/github
 * GET    /me/export
 * DELETE /me/delete-account
 * GET    /users/:userId/profile
 * GET    /files/:key(*)
 * POST   /consent
 * POST   /onboarding
 * GET    /protected/student
 * GET    /protected/admin
 */

const express = require('express')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const { verifyToken, requireRole } = require('../middleware/auth')
const { requireOnboarded } = require('../middleware/onboarding')
const { requireConsent } = require('../middleware/consent')
const User = require('../models/user.model')
const Resume = require('../models/resume.model')
const Score = require('../models/score.model')
const Badge = require('../models/badge.model')
const GitHub = require('../models/github.model')
const { uploadFile, getFile } = require('../infrastructure/s3')
const { recalculateUserScore } = require('../services/scoring/scoreService')
const { analyticsCache } = require('../services/analytics/analyticsCache')
const { exportUserData, executeRightToErasure, recordConsentEvent } = require('../services/privacy/privacyService')
const logger = require('../utils/logger')

// Consent
router.post('/consent', verifyToken, async (req, res, next) => {
    try {
        const { consented } = req.body
        if (typeof consented !== 'boolean') return res.status(400).json({ error: 'consented (boolean) is required' })
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ error: 'User not found' })
        user.dpdpConsent = { consented: !!consented, timestamp: new Date() }
        await user.save()
        try {
            await recordConsentEvent(req.user.id, consented)
        } catch (historyErr) {
            logger.error('Consent history recording error:', { error: historyErr.message })
        }
        return res.json({ message: 'Consent recorded', dpdpConsent: user.dpdpConsent })
    } catch (err) {
        next(err)
    }
})

// Get current user (minimal — auth hydration)
router.get('/me', verifyToken, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash')
        if (!user) return res.status(404).json({ error: 'User not found' })
        const onboardingRequired = !(user.department && user.graduationYear)
        return res.json({ user, onboardingRequired })
    } catch (err) {
        next(err)
    }
})

// Get full profile
router.get('/me/profile', verifyToken, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash')
        if (!user) return res.status(404).json({ error: 'User not found' })
        return res.json({
            profile: {
                id: user._id, name: user.name, email: user.email, department: user.department,
                graduationYear: user.graduationYear, bio: user.bio || '', profilePicture: user.profilePicture || '',
                socialLinks: user.socialLinks || {}, projects: user.projects || [],
                experiences: user.experiences || [], profileVisibility: user.profileVisibility || 'public',
                github: user.github, createdAt: user.createdAt,
            },
        })
    } catch (err) {
        next(err)
    }
})

// Update profile
router.put('/me/profile', verifyToken, async (req, res, next) => {
    try {
        const allowed = ['name', 'department', 'graduationYear', 'bio', 'profilePicture', 'socialLinks', 'projects', 'experiences', 'profileVisibility']
        const updates = {}
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key]
        }
        const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select('-passwordHash')
        if (!user) return res.status(404).json({ error: 'User not found' })
        try {
            await recalculateUserScore(user._id)
            analyticsCache.clear()
        } catch (scoreErr) {
            logger.error('[Profile] Score/Cache sync error:', { error: scoreErr.message })
        }
        logger.info(`[Profile] Updated profile for user ${user.email}`)
        return res.json({
            message: 'Profile updated successfully',
            profile: {
                id: user._id, name: user.name, email: user.email, department: user.department,
                graduationYear: user.graduationYear, bio: user.bio || '', profilePicture: user.profilePicture || '',
                socialLinks: user.socialLinks || {}, projects: user.projects || [],
                experiences: user.experiences || [], profileVisibility: user.profileVisibility || 'public',
            },
        })
    } catch (err) {
        next(err)
    }
})

// Upload avatar
router.post('/me/avatar', verifyToken, async (req, res, next) => {
    try {
        if (!req.files || !req.files.avatar) return res.status(400).json({ error: 'No file uploaded' })
        const file = req.files.avatar
        const uploadDir = path.join(__dirname, '../../uploads')
        const fileExt = path.extname(file.name)
        const filename = `avatar-${req.user.id}-${Date.now()}${fileExt}`
        let fileUrl

        try {
            const s3Key = `avatars/${filename}`
            await uploadFile(file.data, s3Key, file.mimetype)
            fileUrl = `${req.protocol}://${req.get('host')}/files/${s3Key}`
            logger.info(`[Avatar] Uploaded to S3: ${fileUrl}`)
        } catch (s3Err) {
            logger.warn('[Avatar] S3 upload failed, falling back to local', { error: s3Err.message })
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
            await file.mv(path.join(uploadDir, filename))
            fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`
        }

        const user = await User.findByIdAndUpdate(req.user.id, { profilePicture: fileUrl }, { new: true }).select('-passwordHash')
        analyticsCache.clear()
        return res.json({ message: 'Avatar uploaded successfully', url: fileUrl, profile: { profilePicture: user.profilePicture } })
    } catch (err) {
        next(err)
    }
})

// Get user's resume status
router.get('/me/resume', verifyToken, async (req, res, next) => {
    try {
        const latestResume = await Resume.findOne({ user: req.user.id })
            .sort({ uploadedAt: -1, createdAt: -1 })
            .select('originalFilename fileKey status atsScore parsedSkills uploadedAt createdAt')
        if (!latestResume) return res.json({ hasResume: false })
        return res.json({
            hasResume: true,
            resume: {
                resumeId: latestResume.fileKey || latestResume._id.toString(),
                filename: latestResume.originalFilename,
                status: latestResume.status,
                atsScore: latestResume.atsScore,
                parsedSkills: latestResume.parsedSkills,
                uploadedAt: latestResume.uploadedAt || latestResume.createdAt,
            },
        })
    } catch (err) {
        next(err)
    }
})

// Get user's GitHub connection status
router.get('/me/github', verifyToken, async (req, res, next) => {
    try {
        const githubData = await GitHub.findOne({ user: req.user.id })
        if (!githubData) return res.json({ connected: false })
        const profile = {
            ...githubData.profile?.toObject?.() || githubData.profile || {},
            login: githubData.profile?.login || githubData.githubUsername,
        }
        const isStale = githubData.lastSyncedAt && (Date.now() - new Date(githubData.lastSyncedAt).getTime() > 24 * 60 * 60 * 1000)
        return res.json({
            connected: true,
            github: { username: githubData.githubUsername, profile, stats: githubData.stats, lastSyncedAt: githubData.lastSyncedAt },
            isStale,
        })
    } catch (err) {
        next(err)
    }
})

// Export own data (GDPR self-service)
router.get('/me/export', verifyToken, async (req, res, next) => {
    try {
        const data = await exportUserData(req.user.id)
        return res.json(data)
    } catch (err) {
        next(err)
    }
})

// Delete own account (GDPR self-service)
router.delete('/me/delete-account', verifyToken, async (req, res, next) => {
    try {
        const result = await executeRightToErasure(req.user.id, req.user.id)
        return res.json(result)
    } catch (err) {
        next(err)
    }
})

// File proxy (serve S3 objects through backend)
router.get('/files/:key(*)', async (req, res, next) => {
    try {
        const { key } = req.params
        if (!key) return res.status(400).send('Key is required')
        logger.info(`[Proxy] Fetching file: ${key}`)
        const buffer = await getFile(key)
        const ext = path.extname(key).toLowerCase()
        const mimeTypes = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
        res.set('Content-Type', mimeTypes[ext] || 'application/octet-stream')
        res.send(buffer)
    } catch (err) {
        logger.error(`[Proxy] Error: ${err.message}`)
        res.status(404).send('File not found')
    }
})

// Get public profile of any user
router.get('/users/:userId/profile', async (req, res, next) => {
    try {
        const { userId } = req.params
        const user = await User.findById(userId).select('-passwordHash -email')
        if (!user) return res.status(404).json({ error: 'User not found' })

        if (user.profileVisibility === 'private') {
            return res.json({ profile: { id: user._id, name: user.name, department: user.department, graduationYear: user.graduationYear, isPrivate: true } })
        }

        const latestScore = await Score.findOne({ user: userId }).sort({ createdAt: -1 })
        const userBadges = await Badge.find({ user: userId }).populate('definitionId').sort({ earnedAt: -1 })
        const githubDoc = await GitHub.findOne({ user: userId })
        const baseUrl = `${req.protocol}://${req.get('host')}`

        const formattedBadges = userBadges.map(b => {
            const def = b.definitionId
            let iconUrl = def ? def.icon : (b.metadata?.icon || '🏅')
            if (iconUrl && iconUrl.startsWith('/')) iconUrl = `${baseUrl}${iconUrl}`
            return { name: def ? def.name : b.badgeType, description: def ? def.description : (b.metadata?.description || 'Awarded badge'), icon: iconUrl, earnedAt: b.earnedAt, points: def ? def.points : 0 }
        })

        let finalAvatar = user.profilePicture || ''
        if (!finalAvatar && githubDoc?.profile?.avatarUrl) finalAvatar = githubDoc.profile.avatarUrl

        return res.json({
            profile: {
                id: user._id, name: user.name, department: user.department, graduationYear: user.graduationYear,
                bio: user.bio || '', profilePicture: finalAvatar, socialLinks: user.socialLinks || {},
                projects: user.projects || [], experiences: user.experiences || [],
                github: githubDoc ? { username: githubDoc.githubUsername } : (user.github?.username ? { username: user.github.username } : null),
                score: latestScore ? { total: latestScore.totalScore, ats: latestScore.atsComponent, github: latestScore.githubScore, badges: latestScore.badgesScore } : null,
                badges: formattedBadges, isPrivate: false,
            },
        })
    } catch (err) {
        next(err)
    }
})

// Onboarding
router.post('/onboarding', verifyToken, async (req, res, next) => {
    try {
        const { department, graduationYear } = req.body
        if (!department || !graduationYear) return res.status(400).json({ error: 'department and graduationYear are required' })
        const yearNum = Number(graduationYear)
        if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) return res.status(400).json({ error: 'graduationYear must be a valid year' })
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ error: 'User not found' })
        user.department = department
        user.graduationYear = yearNum
        await user.save()
        return res.json({ message: 'Onboarding complete', user: { id: user._id, department: user.department, graduationYear: user.graduationYear } })
    } catch (err) {
        next(err)
    }
})

// Protected example routes
router.get('/protected/student', verifyToken, requireOnboarded, (req, res) => {
    return res.json({ message: `Hello ${req.user.name}, you are authenticated as ${req.user.role}` })
})
router.get('/protected/admin', verifyToken, requireOnboarded, requireRole('admin'), (req, res) => {
    return res.json({ message: `Hello Admin ${req.user.name}` })
})

module.exports = router
