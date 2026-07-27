const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  userId: String,          // sender number (no @)
  jid: String,             // where it was sent
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);