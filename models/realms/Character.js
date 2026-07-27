const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  characterId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  anime: { type: String, required: true },
  gender: { type: String, default: "Unknown" },
  element: { type: String, default: "Neutral" },
  role: { type: String, default: "Attacker" },
  class: { type: String, default: "Warrior" },
  tier: { type: String, default: "Common" },
  rarity: { type: Number, default: 1 }, // 1-10 (Common to Void)
  stars: { type: Number, default: 1 },
  
  // Stats
  hp: { type: Number, default: 100 },
  maxHp: { type: Number, default: 100 },
  attack: { type: Number, default: 10 },
  defense: { type: Number, default: 10 },
  speed: { type: Number, default: 10 },
  accuracy: { type: Number, default: 100 },
  critRate: { type: Number, default: 5 },
  critDamage: { type: Number, default: 50 },
  evasion: { type: Number, default: 5 },
  
  // Skills
  passiveSkill: {
    name: String,
    description: String
  },
  skillOne: {
    name: String,
    description: String,
    damage: Number
  },
  skillTwo: {
    name: String,
    description: String,
    damage: Number
  },
  ultimateSkill: {
    name: String,
    description: String,
    damage: Number
  },
  
  // Media
  artwork: { type: String }, // URL to image
  battleArtwork: { type: String },
  ultimateArtwork: { type: String },
  
  // Metadata
  lore: { type: String },
  ownerCount: { type: Number, default: 0 },
  releaseDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RealmCharacter', characterSchema);
