/**
 * Resume Routes
 * POST /resumes/upload
 * POST /resumes/upload-url
 * POST /resumes/complete
 * POST /resumes/ats-result
 * POST /resumes/parse
 */

const express = require('express')
const path = require('path')
const router = express.Router()
const { verifyToken } = require('../middleware/auth')
const { requireConsent } = require('../middleware/consent')
const Resume = require('../models/resume.model')
const { uploadFile, generateUploadUrl, getFile } = require('../infrastructure/s3')
const { recalculateUserScore } = require('../scoreService')
const { processResume } = require('../services/scoring/resumeProcessingService')
const logger = require('../utils/logger')

// Upload resume directly (with file)
router.post('/resumes/upload', verifyToken, requireConsent, async (req, res, next) => {
    try {
        if (!req.files || !req.files.resume) return res.status(400).json({ error: 'No resume file uploaded' })
        const file = req.files.resume
        const userId = req.user.id

        const allowed = ['.pdf', '.docx']
        const ext = path.extname(file.name).toLowerCase()
        if (!allowed.includes(ext)) return res.status(400).json({ error: 'Only PDF and DOCX files are allowed' })

        const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now())
        const key = `resumes/${userId}/${uuid}${ext}`
        const s3Url = await uploadFile(file.data, key, file.mimetype)

        const resume = await Resume.create({
            user: userId, originalFilename: file.name, contentType: file.mimetype,
            size: file.size, fileKey: key, status: 'uploaded', uploadedAt: new Date(),
        })

        return res.json({ success: true, resume: { id: resume._id, status: resume.status, url: s3Url } })
    } catch (err) {
        next(err)
    }
})

// Generate pre-signed S3 upload URL
router.post('/resumes/upload-url', verifyToken, requireConsent, async (req, res, next) => {
    try {
        const { filename, contentType, size } = req.body
        if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' })

        const lower = filename.toLowerCase()
        if (!['.pdf', '.docx'].some(ext => lower.endsWith(ext))) return res.status(400).json({ error: 'Only PDF and DOCX files are allowed' })

        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(contentType)) return res.status(400).json({ error: 'Invalid contentType for PDF/DOCX' })

        const userId = req.user.id
        const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now())
        const ext = filename.slice(filename.lastIndexOf('.'))
        const key = `resumes/${userId}/${uuid}${ext}`

        const resume = await Resume.create({ user: userId, originalFilename: filename, contentType, size: size || 0, fileKey: key, status: 'pending' })
        const url = await generateUploadUrl(key, contentType)
        return res.json({ uploadUrl: url, fileKey: key, resumeId: resume._id })
    } catch (err) {
        next(err)
    }
})

// Mark resume upload as complete (client finished PUT to S3)
router.post('/resumes/complete', verifyToken, requireConsent, async (req, res, next) => {
    try {
        const { resumeId, size } = req.body
        if (!resumeId) return res.status(400).json({ error: 'resumeId required' })
        const resume = await Resume.findById(resumeId)
        if (!resume) return res.status(404).json({ error: 'Resume not found' })
        if (resume.user.toString() !== req.user.id) return res.status(403).json({ error: 'Not allowed' })
        resume.status = 'uploaded'
        if (size) resume.size = size
        resume.uploadedAt = new Date()
        await resume.save()
        try {
            await recalculateUserScore(req.user.id)
        } catch (err) {
            logger.error('recalculateUserScore error after complete:', { error: err.message })
        }
        return res.json({ message: 'Resume upload recorded', resumeId: resume._id })
    } catch (err) {
        next(err)
    }
})

// ATS service callback (POST scoring results back to backend)
router.post('/resumes/ats-result', async (req, res, next) => {
    try {
        const { resumeId, atsScore, parsedSkills, parsingErrors } = req.body
        if (!resumeId || typeof atsScore !== 'number') return res.status(400).json({ error: 'resumeId and numeric atsScore required' })
        const resume = await Resume.findById(resumeId)
        if (!resume) return res.status(404).json({ error: 'Resume not found' })
        resume.atsScore = atsScore
        if (Array.isArray(parsedSkills)) resume.parsedSkills = parsedSkills
        if (Array.isArray(parsingErrors)) resume.parsingErrors = parsingErrors
        resume.status = 'scored'
        await resume.save()
        try {
            await recalculateUserScore(String(resume.user))
        } catch (err) {
            logger.error('recalculateUserScore error after ats-result:', { error: err.message })
        }
        return res.json({ message: 'ATS result recorded', resumeId: resume._id })
    } catch (err) {
        next(err)
    }
})

// Parse resume — proxy to Python ATS microservice
router.post('/resumes/parse', verifyToken, async (req, res, next) => {
    try {
        const { resumeId, job_description } = req.body

        if (resumeId) {
            const resume = await Resume.findById(resumeId)
            if (!resume) return res.status(404).json({ error: 'Resume not found' })

            let fileBuffer
            try {
                fileBuffer = await getFile(resume.fileKey)
            } catch (err) {
                logger.error('Failed to get file from S3:', { error: err.message })
                return res.status(500).json({ error: 'Failed to retrieve resume file' })
            }

            const result = await processResume({
                resumeId: resume._id.toString(),
                fileBuffer,
                originalFilename: resume.originalFilename,
                contentType: resume.contentType,
                jobDescription: job_description,
                userId: req.user.id,
            })

            return res.json({ ...result, modelInfo: result.model_info, similarityMethod: result.similarity_method })
        }

        if (req.files?.file) {
            return res.status(400).json({ error: 'Legacy upload deprecated. Use /resumes/upload first.' })
        }

        return res.status(400).json({ error: 'resumeId is required' })
    } catch (err) {
        next(err)
    }
})

module.exports = router
