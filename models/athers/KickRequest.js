const mongoose = require('mongoose');

/**
 * Cross-bot kick request coordination.
 * Used when one bot isn't admin and needs to ask other bots in the network.
 */
const kickRequestSchema = new mongoose.Schema({
  targetJid: { type: String, required: true },
  communityJid: { type: String, required: true },
  requesterJid: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  executorBot: { type: String }, // Name of the bot that performed the kick
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour
});

module.exports = mongoose.model('KickRequest', kickRequestSchema);
