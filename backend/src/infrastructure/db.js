/**
 * Database Infrastructure
 *
 * Moved from src/db.js to src/infrastructure/db.js.
 * Provides the mongoose connection helper used at startup.
 */

const mongoose = require('mongoose')
const logger = require('../utils/logger')

async function connect() {
    const uri = process.env.MONGO_URI
    if (!uri) {
        logger.error('MONGO_URI is not set — cannot connect to database')
        process.exit(1)
    }
    await mongoose.connect(uri)
    logger.info('MongoDB connected')
}

module.exports = { connect }
