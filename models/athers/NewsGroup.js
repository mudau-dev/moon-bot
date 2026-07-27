const mongoose = require("mongoose");

const NewsGroupSchema = new mongoose.Schema({
    groupJid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    enabled: {
        type: Boolean,
        default: true
    },

    addedBy: {
        type: String,
        default: null
    },

    addedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("NewsGroup", NewsGroupSchema);