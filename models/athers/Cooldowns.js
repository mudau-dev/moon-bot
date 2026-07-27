const mongoose = require('mongoose');

const commandSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0
  },

  cooldownUntil: {
    type: Number,
    default: 0
  }

}, { _id: false });

const cooldownSchema = new mongoose.Schema({

  userId: {
    type: String,
    required: true
  },

  commands: {
    type: Map,
    of: commandSchema,
    default: () => ({})
  },

  createdAt: {
    type: Number,
    default: Date.now
  },

  updatedAt: {
    type: Number,
    default: Date.now
  }

});

cooldownSchema.index({ userId: 1 });

// keep timestamps updated
cooldownSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ---------------- SAFE GET ----------------
cooldownSchema.methods.getCommand = function(cmd) {

  if (!this.commands)
    this.commands = new Map();

  let c = this.commands.get(cmd);

  if (!c) {

    c = {
      count: 0,
      cooldownUntil: 0
    };

    this.commands.set(cmd, c);
  }

  return c;
};

// ---------------- SAFE SET ----------------
cooldownSchema.methods.setCommand = function(cmd, data) {

  if (!this.commands)
    this.commands = new Map();

  this.commands.set(cmd, {
    count: data.count || 0,
    cooldownUntil: data.cooldownUntil || 0
  });

};

// ---------------- SAFE SERIALIZATION FIX ----------------
cooldownSchema.methods.safeGet = function(cmd) {

  const c = this.getCommand(cmd);

  return {
    count: c?.count ?? 0,
    cooldownUntil: c?.cooldownUntil ?? 0
  };

};

module.exports = mongoose.model('Cooldown', cooldownSchema);