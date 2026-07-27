const mongoose = require("mongoose");

const SanctumSpawnSchema = new mongoose.Schema({
    groupId: { type: String, unique: true, required: true },
    spawnEnabled: { type: Boolean, default: true },
    activeSpawn: {
        name: String,
        level: Number,
        rarity: String,
        element: String,
        personality: String,
        image: String,
        spawnedAt: { type: Date, default: Date.now }
    }
});

module.exports = mongoose.model("SanctumSpawn", SanctumSpawnSchema);
