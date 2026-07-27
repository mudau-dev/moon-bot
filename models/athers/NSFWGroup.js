const mongoose = require('mongoose');

const nsfwGroupSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
    unique: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  enabledBy: {
    type: String,
    default: null
  },
  enabledAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('NSFWGroup', nsfwGroupSchema);
