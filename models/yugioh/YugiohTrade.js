// models/yugioh/YugiohTrade.js
// Tracks pending Yu-Gi-Oh card trades and sales between users.

const mongoose = require('mongoose');

const YugiohTradeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['trade', 'sale'],
    required: true
  },

  // Initiator
  fromJid:       { type: String, required: true },
  fromCardId:    { type: mongoose.Schema.Types.ObjectId, ref: 'YugiohCard', required: true },
  fromCardName:  { type: String },

  // Target
  toJid:         { type: String, required: true },
  toCardId:      { type: mongoose.Schema.Types.ObjectId, ref: 'YugiohCard', default: null },
  toCardName:    { type: String, default: null },

  // Sale price (only for type=sale)
  price:         { type: Number, default: 0 },

  // Group where the offer was made
  groupJid:      { type: String },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },

  // Auto-expire after 5 minutes
  expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000) },
}, { timestamps: true });

YugiohTradeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('YugiohTrade', YugiohTradeSchema);
