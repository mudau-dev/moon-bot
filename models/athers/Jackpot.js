const mongoose = require('mongoose');

const jackpotSchema = new mongoose.Schema({
  pool: { type: Number, default: 0 },
  entries: [{ userId: String, username: String, amount: Number, tickets: Number }],
  lastWinner: { type: String, default: null },
  lastWinAmount: { type: Number, default: 0 },
  lastDrawAt: { type: Date, default: null }
});

module.exports = mongoose.model('Jackpot', jackpotSchema);
