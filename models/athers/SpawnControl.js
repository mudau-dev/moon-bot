const mongoose = require('mongoose');

const SpawnControlSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  pokemon: { type: String, default: null },
  level: { type: Number, default: 5 },
  spawnedAt: { type: Date, default: null },
  spawnInterval: { type: Number, default: 30 }, // minutes between spawns
  lastSpawn: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.models?.SpawnControl || mongoose.model('SpawnControl', SpawnControlSchema);
