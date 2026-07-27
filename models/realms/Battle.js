const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  
  // Enemy Data
  enemy: {
    name: String,
    anime: String,
    hp: Number,
    maxHp: Number,
    tier: String,
    rarity: Number,
    artwork: String,
    lore: String
  },
  
  // Player State in Battle
  playerHp: { type: Number, default: 100 },
  playerMaxHp: { type: Number, default: 100 },
  
  // Battle Metadata
  turn: { type: Number, default: 1 },
  status: { type: String, enum: ['active', 'won', 'lost', 'captured'], default: 'active' },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour of inactivity
});

module.exports = mongoose.model('RealmBattle', battleSchema);
