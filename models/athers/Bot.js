const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  lastSeen: { type: Date, default: Date.now },
  staffOnlyMode: { type: Boolean, default: false }
});

module.exports = mongoose.model('Bot', botSchema);
