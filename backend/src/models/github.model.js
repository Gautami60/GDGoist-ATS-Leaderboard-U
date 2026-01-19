const mongoose = require('mongoose')

const GitHubSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    githubUsername: { type: String, required: true, unique: true },
    accessToken: { type: String }, // encrypted in production
    refreshToken: { type: String },
    profile: {
      login: String,
      name: String,
      bio: String,
      avatarUrl: String,
      publicRepos: Number,
      followers: Number,
      following: Number,
      location: String,
      company: String,
    },
    stats: {
      totalCommits: { type: Number, default: 0 },
      totalPullRequests: { type: Number, default: 0 },
      totalStars: { type: Number, default: 0 },
      languages: [String], // e.g., ['JavaScript', 'Python', 'Go']
      topRepositories: [
        {
          name: String,
          stars: Number,
          language: String,
          url: String,
          description: String,
        }
      ],
    },
    lastSyncedAt: { type: Date },
    syncStatus: { type: String, enum: ['pending', 'syncing', 'completed', 'failed'], default: 'pending' },
  },
  { timestamps: true }
)

module.exports = mongoose.models.GitHub || mongoose.model('GitHub', GitHubSchema)
