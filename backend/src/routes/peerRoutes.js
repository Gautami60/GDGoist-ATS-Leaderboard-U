/**
 * Peer Discovery & Connection Routes
 * GET  /peers/search
 * POST /connections/request
 * GET  /connections/pending
 * POST /connections/:connectionId/respond
 * GET  /connections
 */

const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const { verifyToken } = require('../middleware/auth')
const User = require('../models/user.model')
const Connection = require('../models/connection.model')
const Score = require('../models/score.model')
const { recalculateUserScore } = require('../scoreService')

// Search peers by skills / name
router.get('/peers/search', verifyToken, async (req, res, next) => {
    try {
        const { q, skills, limit = 20, page = 1 } = req.query
        const searchQuery = q || (Array.isArray(skills) ? skills.join(' ') : skills) || ''
        if (!searchQuery.trim()) return res.json({ peers: [], totalCount: 0 })

        const pageNum = Math.max(1, parseInt(page, 10) || 1)
        const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 20))
        const skip = (pageNum - 1) * lim

        const pipeline = [
            { $match: { _id: { $ne: new mongoose.Types.ObjectId(req.user.id) }, role: 'student' } },
            {
                $lookup: {
                    from: 'githubs',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'githubDoc',
                },
            },
            { $unwind: { path: '$githubDoc', preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { 'githubDoc.stats.languages': { $regex: searchQuery, $options: 'i' } },
                    ],
                },
            },
            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: lim }],
                    totalCount: [{ $count: 'count' }],
                },
            },
        ]

        const agg = await User.aggregate(pipeline)
        const users = agg[0].data
        const totalCount = agg[0].totalCount[0] ? agg[0].totalCount[0].count : 0
        const baseUrl = `${req.protocol}://${req.get('host')}`

        const peers = await Promise.all(
            users.map(async (u) => {
                const latestScore = await Score.findOne({ user: u._id }).sort({ createdAt: -1 })
                let finalAvatar = u.profilePicture || null
                if (!finalAvatar && u.githubDoc?.profile?.avatarUrl) finalAvatar = u.githubDoc.profile.avatarUrl
                if (finalAvatar && finalAvatar.startsWith('/')) finalAvatar = `${baseUrl}${finalAvatar}`
                return {
                    id: u._id,
                    name: u.name,
                    email: u.email,
                    department: u.department,
                    graduationYear: u.graduationYear,
                    profilePicture: finalAvatar,
                    skills: u.githubDoc?.stats?.languages || [],
                    score: latestScore ? latestScore.totalScore : 0,
                    connected: false,
                }
            }),
        )

        return res.json({ peers, page: pageNum, limit: lim, totalCount })
    } catch (err) {
        next(err)
    }
})

// Send connection request
router.post('/connections/request', verifyToken, async (req, res, next) => {
    try {
        const { recipientId, message } = req.body
        if (!recipientId) return res.status(400).json({ error: 'recipientId required' })
        if (recipientId === req.user.id) return res.status(400).json({ error: 'Cannot connect with yourself' })

        const existing = await Connection.findOne({ requester: req.user.id, recipient: recipientId })
        if (existing) return res.status(409).json({ error: 'Connection request already exists' })

        const connection = await Connection.create({ requester: req.user.id, recipient: recipientId, message, status: 'pending' })
        return res.status(201).json({ connection })
    } catch (err) {
        next(err)
    }
})

// Get pending connection requests
router.get('/connections/pending', verifyToken, async (req, res, next) => {
    try {
        const requests = await Connection.find({ recipient: req.user.id, status: 'pending' }).populate('requester', 'name email department')
        return res.json({ requests })
    } catch (err) {
        next(err)
    }
})

// Accept / reject a connection request
router.post('/connections/:connectionId/respond', verifyToken, async (req, res, next) => {
    try {
        const { connectionId } = req.params
        const { action } = req.body

        if (!['accept', 'reject'].includes(action)) return res.status(400).json({ error: 'action must be accept or reject' })

        const connection = await Connection.findById(connectionId)
        if (!connection) return res.status(404).json({ error: 'Connection not found' })
        if (connection.recipient.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' })

        connection.status = action === 'accept' ? 'accepted' : 'rejected'
        connection.respondedAt = new Date()
        if (action === 'accept') connection.connectedAt = new Date()
        await connection.save()

        if (action === 'accept') {
            const acceptedCount = await Connection.countDocuments({ recipient: req.user.id, status: 'accepted' })
            if (acceptedCount >= 10) {
                await require('../badges').awardBadge(req.user.id, 'networking_ninja', { connections: acceptedCount })
                await recalculateUserScore(req.user.id)
            }
        }

        return res.json({ connection })
    } catch (err) {
        next(err)
    }
})

// Get user's accepted connections
router.get('/connections', verifyToken, async (req, res, next) => {
    try {
        const connections = await Connection.find({
            $or: [
                { requester: req.user.id, status: 'accepted' },
                { recipient: req.user.id, status: 'accepted' },
            ],
        }).populate('requester recipient', 'name email department')
        return res.json({ connections })
    } catch (err) {
        next(err)
    }
})

module.exports = router
