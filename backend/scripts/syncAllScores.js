const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const { connect } = require('../src/db')
const User = require('../src/models/user.model')
const { recalculateUserScore } = require('../src/scoreService')

async function syncAll() {
    try {
        await connect()
        console.log('Connected to DB')

        const users = await User.find({})
        console.log(`Found ${users.length} users. Syncing scores...`)

        for (const user of users) {
            console.log(`Syncing user: ${user.name} (${user._id})`)
            await recalculateUserScore(user._id)
        }

        console.log('Done!')
        process.exit(0)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

syncAll()
