const mongoose = require('mongoose');

const SkillCooldownSchema = new mongoose.Schema({
  skillName: { type: String },
  cooldownUntil: { type: Number, default: 0 },
}, { _id: false });

const BattleHistorySchema = new mongoose.Schema({
  opponent: { type: String },
  result: { type: String, enum: ['win', 'loss'] },
  xpEarned: { type: Number, default: 0 },
  goldEarned: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
}, { _id: false });

const LegacyPlayerSchema = new mongoose.Schema({
  // ── Identity ─────────────────────────────────────────────────────────────
  whatsappId: { type: String, unique: true, required: true },
  name: { type: String, default: 'Unknown' },
  gender: { type: String, enum: ['male', 'female', null], default: null },
  age: { type: Number, default: null },

  // ── Class & Rank ──────────────────────────────────────────────────────────
  class: {
    type: String,
    enum: ['Mage', 'Warrior', 'Assassin', 'Archer', 'Paladin', null],
    default: null,
  },
  rank: { type: String, default: 'Commoner' },
  rankIndex: { type: Number, default: 0 },

  // ── Progression ───────────────────────────────────────────────────────────
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  xpToNext: { type: Number, default: 100 },
  stage: { type: Number, default: 1 },
  stageProgress: { type: Number, default: 0 }, // percentage 0-100
  stagesCompleted: [{ type: Number }],

  // ── Combat Stats ──────────────────────────────────────────────────────────
  hp: { type: Number, default: 100 },
  maxHp: { type: Number, default: 100 },
  mana: { type: Number, default: 100 },
  maxMana: { type: Number, default: 10000000000 },
  attack: { type: Number, default: 10 },
  defense: { type: Number, default: 5 },
  critRate: { type: Number, default: 5 },   // percentage
  magic: { type: Number, default: 10 },
  speed: { type: Number, default: 10 },

  // ── Economy ───────────────────────────────────────────────────────────────
  gold: { type: Number, default: 500 },

  // ── Battle Record ─────────────────────────────────────────────────────────
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  battleHistory: [BattleHistorySchema],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [{ type: String }],
  skillCooldowns: [SkillCooldownSchema],

  // ── Inventory & Equipment ─────────────────────────────────────────────────
  inventory: [{ id: String, name: String, qty: { type: Number, default: 1 } }],
  equipment: {
    weapon: { type: String, default: null },
    armor: { type: String, default: null },
    accessory: { type: String, default: null },
  },

  // ── Achievements & Quests ─────────────────────────────────────────────────
  achievements: [{ type: String }],
  currentQuest: { type: String, default: null },
  currentObjective: { type: String, default: null },

  // ── Profile Theme ─────────────────────────────────────────────────────────
  profileTheme: { type: String, default: 'default' },

  // ── Misc ──────────────────────────────────────────────────────────────────
  lastBlessing: { type: Date, default: null },
  isActive: { type: Boolean, default: false }, // true once gender+age are set
}, { timestamps: true });

module.exports = mongoose.model('LegacyPlayer', LegacyPlayerSchema);
