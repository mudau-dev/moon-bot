const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  // Stable ID generated from the Card API's tier, title, series, and media URL.
  cardId: { type: String, required: true, index: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },

  description: { type: String, default: "" },
  series: { type: String, default: "Unknown" },

  // May be a live URL from the Card API or a legacy binary Buffer.
  media: { type: mongoose.Schema.Types.Mixed, default: null },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    default: "image",
  },
  mediaMime: { type: String, default: "" },

  price: { type: Number, required: true, default: 0, min: 0 },

  // API cards use 1, 2, 3, 4, 5, S (API tier 6), and T7/T8... for future tiers.
  // This intentionally has no enum so higher tiers remain compatible.
  tier: { type: String, required: true, index: true, default: "1" },

  creator: { type: String, required: true, default: "Eclipse Card API" },
  spawnRate: { type: Number, default: 1, min: 1 },
  enabled: { type: Boolean, default: true },

  timesSpawned: { type: Number, default: 0 },
  timesClaimed: { type: Number, default: 0 },

  tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model("Card", cardSchema);
