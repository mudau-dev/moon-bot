// models/yugioh/YugiohCard.js
// Stores a user's owned Yu-Gi-Oh cards (fetched live from YGOPRODeck API).
// Each document = one card instance owned by one user.

const mongoose = require('mongoose');

const YugiohCardSchema = new mongoose.Schema({
  // Owner
  ownerJid: { type: String, required: true, index: true },

  // Card identity (from YGOPRODeck)
  cardId:      { type: Number, required: true },   // YGOPRODeck numeric ID
  name:        { type: String, required: true },
  type:        { type: String },                   // e.g. "Normal Monster"
  frameType:   { type: String },                   // e.g. "normal", "spell", "trap"
  desc:        { type: String },
  race:        { type: String },                   // e.g. "Spellcaster"
  attribute:   { type: String },                   // e.g. "DARK"
  atk:         { type: Number },
  def:         { type: Number },
  level:       { type: Number },
  imageUrl:    { type: String },

  // Rarity derived from the card's most common set rarity
  rarity:      { type: String, default: 'Common' },

  // Where the card lives
  location: {
    type: String,
    enum: ['collection', 'deck'],
    default: 'collection'
  },
  deckSlot: { type: Number, default: null },  // 1-6 when in deck

  // Metadata
  obtainedAt:  { type: Date, default: Date.now },
  spawnedIn:   { type: String },               // group JID where it was spawned
}, { timestamps: true });

module.exports = mongoose.model('YugiohCard', YugiohCardSchema);
