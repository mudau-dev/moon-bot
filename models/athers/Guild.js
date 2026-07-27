const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  ownerId: {
    type: String,
    required: true
  },

  members: {
    type: [String], // Stores only User IDs
    default: []
  },

  banned: {
    type: [String], // Stores only User IDs
    default: []
  },
    
    description: {
    type: String,
    default: "No description has been set."
},

  icon: {
    type: String,
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Guild", guildSchema);