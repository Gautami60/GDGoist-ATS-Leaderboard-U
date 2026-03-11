/**
 * Leaderboard Routes
 * GET /leaderboard
 * GET /leaderboard/admin
 * GET /admin/stats/departments
 * GET /admin/stats/years
 * GET /admin/export/anonymized.csv
 */

const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const { verifyToken, requireRole } = require('../middleware/auth')
const Score = require('../models/score.model')

// Public leaderboard
router.get('/leaderboard', async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    try {
        const { department, graduationYear, limit = 50, page = 1 } = req.query
        const pageNum = Math.max(1, parseInt(page, 10) || 1)
        const lim = Math.max(1, Math.min(200, parseInt(limit, 10) || 50))

        const matchStage = {}
        if (department) matchStage['userDoc.department'] = department
        if (graduationYear) matchStage['userDoc.graduationYear'] = Number(graduationYear)

        const facet = {
            $facet: {
                data: [{ $sort: { totalScore: -1 } }, { $skip: (pageNum - 1) * lim }, { $limit: lim }],
                totalCount: [{ $count: 'count' }],
            },
        }

        const pipeline = [
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
            { $unwind: '$userDoc' },
            { $lookup: { from: 'githubs', localField: 'user', foreignField: 'user', as: 'githubDoc' } },
            { $unwind: { path: '$githubDoc', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'badges',
                    let: { userId: '$user' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
                        { $lookup: { from: 'badgedefinitions', localField: 'definitionId', foreignField: '_id', as: 'definition' } },
                        { $unwind: { path: '$definition', preserveNullAndEmptyArrays: true } },
                    ],
                    as: 'badges',
                },
            },
        ]
        if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage })
        pipeline.push(facet)

        const agg = await Score.aggregate(pipeline)
        const data = (agg[0] && agg[0].data) || []
        const totalCount = (agg[0] && agg[0].totalCount[0] && agg[0].totalCount[0].count) || 0
        const rankOffset = (pageNum - 1) * lim
        const baseUrl = `${req.protocol}://${req.get('host')}`

        const entries = data.map((d, i) => {
            let finalAvatar = d.userDoc.profilePicture || null
            if (!finalAvatar && d.githubDoc?.profile?.avatarUrl) finalAvatar = d.githubDoc.profile.avatarUrl
            return {
                rank: rankOffset + i + 1,
                userId: d.userDoc._id,
                totalScore: d.totalScore,
                name: d.userDoc.name || 'Anonymous',
                department: d.userDoc.department || null,
                graduationYear: d.userDoc.graduationYear || null,
                profilePicture: finalAvatar,
                badges: (d.badges || []).map(b => {
                    let iconUrl = b.definition ? b.definition.icon : (b.metadata?.icon || '🏅')
                    if (iconUrl && iconUrl.startsWith('/')) iconUrl = `${baseUrl}${iconUrl}`
                    return { name: b.definition ? b.definition.name : b.badgeType, icon: iconUrl, points: b.definition ? b.definition.points : 0 }
                }).slice(0, 3),
            }
        })

        return res.json({ totalCount, page: pageNum, limit: lim, entries })
    } catch (err) {
        next(err)
    }
})

// Admin leaderboard (includes PII)
router.get('/leaderboard/admin', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { department, graduationYear, limit = 200, page = 1 } = req.query
        const pageNum = Math.max(1, parseInt(page, 10) || 1)
        const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 200))

        const matchStage = {}
        if (department) matchStage['userDoc.department'] = department
        if (graduationYear) matchStage['userDoc.graduationYear'] = Number(graduationYear)

        const pipeline = [
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
            { $unwind: '$userDoc' },
        ]
        if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage })
        pipeline.push({
            $facet: {
                data: [{ $sort: { totalScore: -1 } }, { $skip: (pageNum - 1) * lim }, { $limit: lim }],
                totalCount: [{ $count: 'count' }],
            },
        })

        const agg = await Score.aggregate(pipeline)
        const data = (agg[0] && agg[0].data) || []
        const totalCount = (agg[0] && agg[0].totalCount[0] && agg[0].totalCount[0].count) || 0
        const rankOffset = (pageNum - 1) * lim
        const entries = data.map((d, i) => ({
            rank: rankOffset + i + 1,
            totalScore: d.totalScore,
            user: { id: d.userDoc._id, name: d.userDoc.name, email: d.userDoc.email },
            department: d.userDoc.department || null,
            graduationYear: d.userDoc.graduationYear || null,
        }))
        return res.json({ totalCount, page: pageNum, limit: lim, entries })
    } catch (err) {
        next(err)
    }
})

// Admin: department stats
router.get('/admin/stats/departments', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const docs = await Score.aggregate([
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
            { $unwind: '$userDoc' },
            { $project: { totalScore: 1, department: '$userDoc.department', graduationYear: '$userDoc.graduationYear' } },
        ])
        const byDept = {}
        for (const d of docs) {
            const dept = d.department || 'Unknown'
            if (!byDept[dept]) byDept[dept] = { scores: [] }
            byDept[dept].scores.push(d.totalScore || 0)
        }
        const buckets = Array.from({ length: 10 }, (_, i) => ({ min: i * 10, max: i * 10 + 9 }))
        const result = []
        for (const [dept, info] of Object.entries(byDept)) {
            const scores = info.scores
            const count = scores.length
            const avg = count ? (scores.reduce((a, b) => a + b, 0) / count) : 0
            const hist = buckets.map(b => ({ range: `${b.min}-${b.max}`, count: 0 }))
            for (const s of scores) { hist[Math.min(9, Math.floor((s || 0) / 10))].count += 1 }
            result.push({ department: dept, count, avg: Number(avg.toFixed(2)), min: count ? Math.min(...scores) : 0, max: count ? Math.max(...scores) : 0, histogram: hist })
        }
        return res.json({ departments: result })
    } catch (err) {
        next(err)
    }
})

// Admin: year-wise stats
router.get('/admin/stats/years', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const docs = await Score.aggregate([
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
            { $unwind: '$userDoc' },
            { $project: { totalScore: 1, graduationYear: '$userDoc.graduationYear' } },
            { $group: { _id: '$graduationYear', count: { $sum: 1 }, avg: { $avg: '$totalScore' }, min: { $min: '$totalScore' }, max: { $max: '$totalScore' } } },
            { $sort: { _id: 1 } },
        ])
        return res.json({ years: docs.map(d => ({ graduationYear: d._id || 'Unknown', count: d.count, avg: Number((d.avg || 0).toFixed(2)), min: d.min || 0, max: d.max || 0 })) })
    } catch (err) {
        next(err)
    }
})

// Admin: anonymized CSV export
router.get('/admin/export/anonymized.csv', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { department, graduationYear } = req.query
        const matchStage = {}
        if (department) matchStage['userDoc.department'] = department
        if (graduationYear) matchStage['userDoc.graduationYear'] = Number(graduationYear)

        const pipeline = [
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
            { $unwind: '$userDoc' },
        ]
        if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage })
        pipeline.push({ $sort: { totalScore: -1 } })
        const docs = await Score.aggregate(pipeline)

        const rows = [['anon_id', 'department', 'graduationYear', 'rank', 'totalScore']]
        let rank = 1
        for (const d of docs) {
            const hash = crypto.createHash('sha256').update(String(d.user)).digest('hex').slice(0, 12)
            rows.push([hash, (d.userDoc && d.userDoc.department) || '', (d.userDoc && d.userDoc.graduationYear) || '', String(rank), String(d.totalScore || 0)])
            rank++
        }
        const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename="leaderboard_anonymized.csv"')
        return res.send(csv)
    } catch (err) {
        next(err)
    }
})

module.exports = router
