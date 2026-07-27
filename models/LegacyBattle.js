const mongoose = require('mongoose');

const LegacyBattleSchema = new mongoose.Schema({
  player1Id: { type: String, required: true },
  player2Id: { type: String, required: true },
  player1Data: {
    name: String,
    hp: Number,
    maxHp: Number,
    mana: Number,
    maxMana: Number,
    level: Number,
    rank: String,
  },
  player2Data: {
    name: String,
    hp: Number,
    maxHp: Number,
    mana: Number,
    maxMana: Number,
    level: Number,
    rank: String,
  },
  turn: { type: String, default: null },
  round: { type: Number, default: 1 },
  status: { type: String, enum: ['pending', 'active', 'finished'], default: 'pending' },
  isPvE: { type: Boolean, default: false },
  stage: { type: Number, default: 1 },
  winner: { type: String, default: null },
  loser: { type: String, default: null },
  battleLog: { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('LegacyBattle', LegacyBattleSchema);
