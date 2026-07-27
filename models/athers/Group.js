const mongoose = require('mongoose');
const groupSchema = new mongoose.Schema({
  groupId: { type: String, unique: true },
  // existing system
  spawnEnabled: { type: Boolean, default: false },
  lastSpawn: { type: Date, default: null },
  spawnCooldown: { type: Number, default: 300000 }, // 5 min
  // =========================
  // GAMBLING CONTROL
  // =========================
  gamblingEnabled: { type: Boolean, default: false },
  // =========================
  // EVENT CONTROL
  // =========================
  eventEnabled: { type: Boolean, default: false },
  // =========================
  // LEGACY BATTLE CONTROL
  // =========================
  legacyBattlesEnabled: { type: Boolean, default: false },
  // =========================
  // ACTIVITY TRACKING
  // =========================
  totalMessages: { type: Number, default: 0 },
  botMessages: { type: Number, default: 0 },
  lastActiveReset: { type: Date, default: Date.now },
  // Spawn Control
  cardsSpawnedThisCycle: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Group', groupSchema);
