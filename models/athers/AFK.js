const mongoose = require('mongoose');

const afkSchema = new mongoose.Schema({

  userId: {
    type: String,
    required: true,
    unique: true
  },

  reason: {
    type: String,
    default: 'No reason'
  },

  since: {
    type: Number,
    default: Date.now
  }

});

module.exports = mongoose.model('AFK', afkSchema);