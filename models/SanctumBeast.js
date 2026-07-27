const mongoose = require("mongoose");

const SanctumBeastSchema = new mongoose.Schema({
    instanceId: { type: String, unique: true, required: true },
    serialNumber: { type: Number, required: true },

    speciesName: { type: String, required: true },
    nickname: { type: String, default: null },

    ownerId: { type: String, required: true },
    originalOwnerId: { type: String, required: true },

    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },

    rarity: { type: String, required: true },
    element: { type: String, required: true },

    personality: { type: String, required: true },
    nature: { type: String, required: true },

    hp: { type: Number, required: true },
    maxHp: { type: Number, required: true },

    attack: { type: Number, required: true },
    defense: { type: Number, required: true },
    speed: { type: Number, required: true },

    energy: { type: Number, required: true },
    maxEnergy: { type: Number, required: true },

    iv: {
        hp: { type: Number, default: 0 },
        attack: { type: Number, default: 0 },
        defense: { type: Number, default: 0 },
        speed: { type: Number, default: 0 }
    },

    skills: { type: Array, default: [] },

    battleWins: { type: Number, default: 0 },
    battleLosses: { type: Number, default: 0 },

    awakened: { type: Boolean, default: false },

    capturedAt: { type: Date, default: Date.now },

    image: { type: String, required: true },
    lore: { type: String, default: "" },
    description: { type: String, default: "" }
});

module.exports = mongoose.model("SanctumBeast", SanctumBeastSchema);