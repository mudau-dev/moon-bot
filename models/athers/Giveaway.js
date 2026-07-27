const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
  id: { type: String, unique: true },
  amount: Number,
  createdAt: Number,
  expiresAt: Number,
  claimed: { type: Boolean, default: false },
  winner: String
});

module.exports = mongoose.model('Giveaway', giveawaySchema);