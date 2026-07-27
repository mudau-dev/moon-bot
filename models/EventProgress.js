const mongoose = require("mongoose");

const EventProgressSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },   // full JID
    groupId: { type: String, default: null },

    currentRound: { type: Number, default: 1, min: 1, max: 10 },
    completedRounds: { type: [Number], default: [] },
    skipsUsed: { type: Number, default: 0 },
    cycleCount: { type: Number, default: 0 },
    eventPoints: { type: Number, default: 0 },

    // Challenge tracking
    challengeActive: { type: Boolean, default: false },
    challengeLevel: { type: Number, default: null },
    challengeStartedAt: { type: Date, default: null },

    // Round timer (25 hours per round)
    roundStartedAt: { type: Date, default: null },
    roundDeadline: { type: Date, default: null },

    // Rewards claimed flags (one per round index 1-10)
    rewardsClaimed: { type: [Number], default: [] },

    // Journey started flag
    started: { type: Boolean, default: false },

    // TASK TRACKING FOR VERIFICATION
    stats: {
      gamblesWon: { type: Number, default: 0 },
      coinsFlipped: { type: Number, default: 0 },
      cardsHunted: { type: Number, default: 0 },
      battlesWon: { type: Number, default: 0 },
      messagesSent: { type: Number, default: 0 }
    },
    
    // Snapshot of stats when challenge started
    challengeStartStats: {
      gamblesWon: { type: Number, default: 0 },
      coinsFlipped: { type: Number, default: 0 },
      cardsHunted: { type: Number, default: 0 },
      battlesWon: { type: Number, default: 0 },
      messagesSent: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventProgress", EventProgressSchema);
