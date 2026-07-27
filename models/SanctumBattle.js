const mongoose = require("mongoose");

const SanctumBattleSchema = new mongoose.Schema({
    player1: {
        type: String,
        required: true
    },
    player2: {
        type: String,
        required: true
    },

    beast1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SanctumBeast",
        required: true
    },
    beast2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SanctumBeast",
        default: null
    },

    hp1: {
        type: Number,
        required: true
    },
    hp2: {
        type: Number,
        default: 0
    },

    energy1: {
        type: Number,
        required: true
    },
    energy2: {
        type: Number,
        default: 0
    },

    turn: {
        type: String,
        required: true
    },

    winner: {
        type: String,
        default: null
    },

    status: {
        type: String,
        enum: ["pending", "active", "finished"],
        default: "pending"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("SanctumBattle", SanctumBattleSchema);