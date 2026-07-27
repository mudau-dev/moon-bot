const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  whatsappNumber: { type: String, required: true },
  
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  maxEnergy: { type: Number, default: 100 },
  
  coins: { type: Number, default: 1000 },
  gems: { type: Number, default: 0 },
  
  rank: { type: String, default: "Novice" },
  battleRating: { type: Number, default: 0 },
  arenaRating: { type: Number, default: 0 },
  
  inventory: [{
    itemId: String,
    quantity: Number
  }],
  
  characters: [{
    characterId: String,
    instanceId: String,
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    stars: { type: Number, default: 1 },
    obtainedAt: { type: Date, default: Date.now }
  }],
  
  team: [String], // Array of instanceIds (max 6)
  
  stats: {
    bossKills: { type: Number, default: 0 },
    pvpWins: { type: Number, default: 0 },
    pvpLosses: { type: Number, default: 0 },
    dungeonClears: { type: Number, default: 0 }
  },
  
  dailyStreak: { type: Number, default: 0 },
  lastDaily: { type: Date }
});

module.exports = mongoose.model('RealmPlayer', playerSchema);
