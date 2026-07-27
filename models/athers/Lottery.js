const mongoose = require('mongoose');

const lotterySchema = new mongoose.Schema({
  active: {
    type: Boolean,
    default: true
  },

  participants: [
    {
      userId: {
        type: String,
        required: true
      },
      entries: {
        type: Number,
        default: 1
      }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Lottery', lotterySchema);