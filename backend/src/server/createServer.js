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
const path = require('path')
const logger = require('../utils/logger')

function createServer() {
    const app = express()

    // ── Core middleware ───────────────────────────────────────────
    app.use(cors())
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
