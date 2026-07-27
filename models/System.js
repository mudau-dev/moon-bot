const mongoose = require('mongoose');

const systemSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('System', systemSchema);