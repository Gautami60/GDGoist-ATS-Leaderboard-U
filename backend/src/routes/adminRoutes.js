/**
 * Admin Routes
 * GET    /admin/users
 * GET    /admin/users/export
 * GET    /admin/analytics/platform
 * GET    /admin/analytics/cohorts
 * GET    /admin/analytics/skills
 * GET    /admin/analytics/at-risk
 * GET    /admin/analytics/trends
 * DELETE /admin/privacy/erase/:userId
 * GET    /admin/privacy/consent/:userId
 * GET    /admin/privacy/export/:userId
 * GET    /admin/audit-logs
 * GET    /admin/badges
 * POST   /admin/badges
 * DELETE /admin/badges/:badgeId
 * POST   /admin/users/:userId/badges
 * DELETE /admin/users/:userId/badges/:badgeId
 */

const express = require('express')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const { verifyToken, requireRole } = require('../middleware/auth')
const { adminLimiter } = require('../middleware/rateLimit')
const User = require('../models/user.model')
const Badge = require('../models/badge.model')
const BadgeDefinition = require('../models/badgeDefinition.model')
const GitHub = require('../models/github.model')
const Score = require('../models/score.model')
const { recalculateUserScore } = require('../scoreService')
const {
    getCohortAnalytics, getSkillIntelligence, getAtRiskCohorts, getTrendAnalysis, getPlatformStats,
} = require('../adminAnalytics')
const {
    executeRightToErasure, getConsentHistory, createAuditLog, getAuditLogs, exportUserData,
} = require('../privacyService')
const { withCache } = require('../analyticsCache')
const { uploadFile } = require('../infrastructure/s3')
const logger = require('../utils/logger')

// Apply rate limiting to all admin routes
router.use(adminLimiter)

// Get all users (admin)
router.get('/admin/users', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '', department = '', graduationYear = '' } = req.query
        const query = { role: { $ne: 'admin' } }
        if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
        if (department) query.department = department
        if (graduationYear) query.graduationYear = parseInt(graduationYear)

        const skip = (parseInt(page) - 1) * parseInt(limit)
        const totalCount = await User.countDocuments(query)
        const users = await User.find(query)
            .select('name email department graduationYear totalScore atsScore githubScore badgesScore hasResume profilePicture createdAt')
            .sort({ totalScore: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit))

        const usersWithData = await Promise.all(users.map(async (u) => {
            const [badges, githubDoc] = await Promise.all([Badge.find({ user: u._id }).populate('definitionId'), GitHub.findOne({ user: u._id })])
            let finalAvatar = u.profilePicture || null
            if (!finalAvatar && githubDoc?.profile?.avatarUrl) finalAvatar = githubDoc.profile.avatarUrl
            return {
                id: u._id, name: u.name || 'Anonymous', email: u.email, department: u.department || 'Not set',
                graduationYear: u.graduationYear || null, totalScore: u.totalScore || 0, atsScore: u.atsScore || 0,
                githubScore: u.githubScore || 0, badgesScore: u.badgesScore || 0, hasResume: !!u.hasResume,
                profilePicture: finalAvatar, githubUsername: githubDoc?.githubUsername || null, joinedAt: u.createdAt,
                badges: badges.map(b => { const bObj = b.toObject(); return { ...bObj, definition: bObj.definitionId } }) || [],
            }
        }))

        await createAuditLog('ADMIN_VIEW_USERS', req.user.id, { search, department, graduationYear })
        return res.json({ users: usersWithData, totalCount, page: parseInt(page), totalPages: Math.ceil(totalCount / parseInt(limit)) })
    } catch (err) {
        next(err)
    }
})

// Export users CSV
router.get('/admin/users/export', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { search = '', department = '', graduationYear = '' } = req.query
        const query = { role: { $ne: 'admin' } }
        if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
        if (department) query.department = department
        if (graduationYear) query.graduationYear = parseInt(graduationYear)

        const users = await User.find(query)
            .select('name email department graduationYear totalScore atsScore githubScore badgesScore bio profilePicture createdAt')
            .sort({ totalScore: -1 })

        let csv = 'Name,Email,Department,Year,Total Score,ATS Score,GitHub Score,Badges Score,Bio,Profile Picture,Joined At\n'
        users.forEach(u => {
            const bio = (u.bio || '').replace(/"/g, '""')
            csv += [`"${u.name || 'Anonymous'}"`, `"${u.email}"`, `"${u.department || 'Not set'}"`,
            u.graduationYear || '', u.totalScore || 0, u.atsScore || 0, u.githubScore || 0, u.badgesScore || 0,
            `"${bio}"`, `"${u.profilePicture || ''}"`, `"${new Date(u.createdAt).toISOString()}"`].join(',') + '\n'
        })

        await createAuditLog('ADMIN_EXPORT_USERS', req.user.id, { search, department, graduationYear })
        res.header('Content-Type', 'text/csv')
        res.attachment(`users_export_${Date.now()}.csv`)
        return res.send(csv)
    } catch (err) {
        next(err)
    }
})

// Platform overview
router.get('/admin/analytics/platform', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const stats = await withCache('getPlatformStats', {}, async () => getPlatformStats())
        await createAuditLog('ADMIN_VIEW_PLATFORM_STATS', req.user.id)
        return res.json(stats)
    } catch (err) {
        next(err)
    }
})

// Cohort analytics
router.get('/admin/analytics/cohorts', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { department, graduationYear } = req.query
        const analytics = await withCache('getCohortAnalytics', { department, graduationYear }, async () => getCohortAnalytics({ department, graduationYear }))
        await createAuditLog('ADMIN_VIEW_COHORT_ANALYTICS', req.user.id, { department, graduationYear })
        return res.json({ cohorts: analytics })
    } catch (err) {
        next(err)
    }
})

// Skill intelligence
router.get('/admin/analytics/skills', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { department, graduationYear } = req.query
        const skills = await withCache('getSkillIntelligence', { department, graduationYear }, async () => getSkillIntelligence({ department, graduationYear }))
        await createAuditLog('ADMIN_VIEW_SKILL_INTELLIGENCE', req.user.id, { department, graduationYear })
        return res.json(skills)
    } catch (err) {
        next(err)
    }
})

// At-risk cohorts
router.get('/admin/analytics/at-risk', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const atRisk = await withCache('getAtRiskCohorts', {}, async () => getAtRiskCohorts())
        await createAuditLog('ADMIN_VIEW_AT_RISK_COHORTS', req.user.id)
        return res.json({ atRiskCohorts: atRisk })
    } catch (err) {
        next(err)
    }
})

// Trend analysis
router.get('/admin/analytics/trends', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { department, graduationYear, months } = req.query
        const trends = await withCache('getTrendAnalysis', { department, graduationYear, months }, async () => getTrendAnalysis({ department, graduationYear, months: months ? Number(months) : 6 }))
        await createAuditLog('ADMIN_VIEW_TRENDS', req.user.id, { department, graduationYear, months })
        return res.json({ trends })
    } catch (err) {
        next(err)
    }
})

// Right to erasure
router.delete('/admin/privacy/erase/:userId', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const result = await executeRightToErasure(req.params.userId, req.user.id)
        return res.json(result)
    } catch (err) {
        next(err)
    }
})

// Consent history
router.get('/admin/privacy/consent/:userId', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const history = await getConsentHistory(req.params.userId)
        await createAuditLog('ADMIN_VIEW_CONSENT_HISTORY', req.user.id, { targetUser: req.params.userId })
        return res.json({ consentHistory: history })
    } catch (err) {
        next(err)
    }
})

// Export user data
router.get('/admin/privacy/export/:userId', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const data = await exportUserData(req.params.userId)
        await createAuditLog('ADMIN_EXPORT_USER_DATA', req.user.id, { targetUser: req.params.userId })
        return res.json(data)
    } catch (err) {
        next(err)
    }
})

// Audit logs
router.get('/admin/audit-logs', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { action, performedBy, startDate, endDate, limit } = req.query
        const logs = await getAuditLogs({ action, performedBy, startDate, endDate }, limit ? Number(limit) : 100)
        return res.json({ logs })
    } catch (err) {
        next(err)
    }
})

// Create badge definition (with icon upload)
router.post('/admin/badges', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { name, description, criteria, points } = req.body
        if (!req.files || !req.files.icon) return res.status(400).json({ error: 'Icon image is required' })
        const iconFile = req.files.icon
        if (!iconFile.mimetype.startsWith('image/')) return res.status(400).json({ error: 'File must be an image' })

        const fileExt = path.extname(iconFile.name)
        const iconFilename = `badge_${Date.now()}${fileExt}`
        let iconUrl

        try {
            const s3Key = `badges/${iconFilename}`
            await uploadFile(iconFile.data, s3Key, iconFile.mimetype)
            iconUrl = `${req.protocol}://${req.get('host')}/files/${s3Key}`
            logger.info(`[Badge] Icon uploaded to S3: ${iconUrl}`)
        } catch (s3Err) {
            logger.warn('S3 Badge Upload failed, falling back to local', { error: s3Err.message })
            const uploadPath = path.join(__dirname, '../../uploads/badges', iconFilename)
            const badgeDir = path.dirname(uploadPath)
            if (!fs.existsSync(badgeDir)) fs.mkdirSync(badgeDir, { recursive: true })
            await iconFile.mv(uploadPath)
            iconUrl = `/uploads/badges/${iconFilename}`
        }

        const badgeDef = await BadgeDefinition.create({ name, description, criteria, icon: iconUrl, points: points ? Number(points) : 2 })
        await createAuditLog('ADMIN_CREATE_BADGE', req.user.id, { badgeName: name })
        return res.json({ badge: badgeDef })
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'Badge name already exists' })
        next(err)
    }
})

// Soft-delete badge definition
router.delete('/admin/badges/:badgeId', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const badgeDef = await BadgeDefinition.findById(req.params.badgeId)
        if (!badgeDef) return res.status(404).json({ error: 'Badge not found' })
        badgeDef.active = false
        await badgeDef.save()
        await createAuditLog('ADMIN_DELETE_BADGE', req.user.id, { badgeName: badgeDef.name, badgeId: req.params.badgeId })
        return res.json({ success: true, message: 'Badge deleted successfully' })
    } catch (err) {
        next(err)
    }
})

// Assign badge to user
router.post('/admin/users/:userId/badges', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { userId } = req.params
        const { badgeDefinitionId } = req.body
        if (!badgeDefinitionId) return res.status(400).json({ error: 'Badge Definition ID required' })
        const badgeDef = await BadgeDefinition.findById(badgeDefinitionId)
        if (!badgeDef) return res.status(404).json({ error: 'Badge Definition not found' })
        const existing = await Badge.findOne({ user: userId, definitionId: badgeDefinitionId })
        if (existing) return res.status(400).json({ error: 'User already has this badge' })
        const newBadge = await Badge.create({ user: userId, badgeType: badgeDef.name, definitionId: badgeDef._id, earnedAt: new Date() })
        await recalculateUserScore(userId)
        await createAuditLog('ADMIN_ASSIGN_BADGE', req.user.id, { targetUser: userId, badgeName: badgeDef.name })
        return res.json({ success: true, badge: newBadge })
    } catch (err) {
        next(err)
    }
})

// Remove badge from user
router.delete('/admin/users/:userId/badges/:badgeId', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { userId, badgeId } = req.params
        const badge = await Badge.findById(badgeId)
        if (!badge) return res.status(404).json({ error: 'Badge not found' })
        if (String(badge.user) !== String(userId)) {
            logger.warn(`[Admin] Owner mismatch on badge delete: ${badge.user} vs ${userId}`)
        }
        const definition = await BadgeDefinition.findById(badge.definitionId)
        await Badge.deleteOne({ _id: badgeId })
        await recalculateUserScore(userId)
        await createAuditLog('ADMIN_REMOVE_BADGE', req.user.id, { targetUser: userId, badgeType: badge.badgeType, badgeName: definition ? definition.name : 'Unknown' })
        return res.json({ success: true, message: 'Badge removed' })
    } catch (err) {
        next(err)
    }
})

module.exports = router
