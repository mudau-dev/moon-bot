// models/athers/CategoryLock.js
// ─────────────────────────────────────────────────────────────────────────────
// Stores the lock/open state of each command category.
// Shared across all bots via the same MongoDB — one document per category.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const CategoryLockSchema = new mongoose.Schema({
  // Category name exactly as used in moon({ category: '...' })
  category: { type: String, required: true, unique: true, lowercase: true },

  // Lock state
  locked:   { type: Boolean, default: false },

  // Reason shown to users when they try to use a locked category
  reason:   { type: String, default: 'This category is currently unavailable.' },

  // Who locked it and when
  lockedBy: { type: String, default: null },   // sender JID
  lockedAt: { type: Date,   default: null },
}, { timestamps: true });

module.exports = mongoose.model('CategoryLock', CategoryLockSchema);
