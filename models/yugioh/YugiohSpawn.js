// models/yugioh/YugiohSpawn.js
// Tracks the currently active Yu-Gi-Oh card spawn in each group.
// Only one card can be active per group at a time.

const mongoose = require('mongoose');

const YugiohSpawnSchema = new mongoose.Schema({
  groupJid: { type: String, required: true, unique: true, index: true },

  // The spawned card data (snapshot from YGOPRODeck)
  cardId:    { type: Number, required: true },
  name:      { type: String, required: true },
  type:      { type: String },
  frameType: { type: String },
  desc:      { type: String },
  race:      { type: String },
  attribute: { type: String },
  atk:       { type: Number },
  def:       { type: Number },
  level:     { type: Number },
  imageUrl:  { type: String },
  rarity:    { type: String, default: 'Common' },

  spawnedAt: { type: Date, default: Date.now },
  // Auto-expire after 10 minutes if unclaimed
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) },
}, { timestamps: true });

// TTL index — MongoDB will auto-delete expired spawns
YugiohSpawnSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('YugiohSpawn', YugiohSpawnSchema);
