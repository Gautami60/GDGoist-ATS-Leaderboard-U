/**
 * Express App Factory
 *
 * Creates and configures the Express application:
 * - Registers all middleware
 * - Does NOT start listening (that's index.js's job)
 * - Does NOT register routes (that's registerRoutes.js's job)
 */

const express = require('express')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const helmet = require('helmet')
const path = require('path')
const config = require('../config/config')
const logger = require('../utils/logger')

function createServer() {
    const app = express()

    // ── Security headers ──────────────────────────────────────────
    app.use(helmet())

    // ── CORS ──────────────────────────────────────────────────────
    const corsOptions = {
        origin: config.NODE_ENV === 'production'
            ? (config.ALLOWED_ORIGINS ? config.ALLOWED_ORIGINS.split(',') : [])
            : '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    }
    app.use(cors(corsOptions))

    // ── Core middleware ───────────────────────────────────────────
    app.use(express.json())
    app.use(fileUpload())
    app.use('/uploads', express.static(path.join(__dirname, '../../uploads')))

    // ── Request logging middleware ────────────────────────────────
    app.use((req, _res, next) => {
        logger.info(`→ ${req.method} ${req.path}`)
        next()
    })

    return app
}

module.exports = createServer
