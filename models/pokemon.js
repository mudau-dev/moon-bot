const mongoose = require("mongoose");

const PokemonSchema = new mongoose.Schema({
    pokemonId: { type: String, unique: true, required: true },
    userId: { type: String, required: true }, // WhatsApp JID of the owner
    pokedexNumber: { type: Number, required: true },
    name: { type: String, required: true },
    nickname: { type: String, default: null },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    type1: { type: String, required: true },
    type2: { type: String, default: null },
    nature: { type: String, default: "Hardy" },
    gender: { type: String, default: "Unknown" },
    captureRate: { type: Number, default: null },
    happiness: { type: Number, default: 0 },
    hp: { type: Number, required: true },
    attack: { type: Number, required: true },
    defense: { type: Number, required: true },
    spAtk: { type: Number, required: true },
    spDef: { type: Number, required: true },
    speed: { type: Number, required: true },
    iv: {
        hp: Number,
        attack: Number,
        defense: Number,
        spAtk: Number,
        spDef: Number,
        speed: Number,
    },
    ev: {
        hp: { type: Number, default: 0 },
        attack: { type: Number, default: 0 },
        defense: { type: Number, default: 0 },
        spAtk: { type: Number, default: 0 },
        spDef: { type: Number, default: 0 },
        speed: { type: Number, default: 0 },
    },
    moves: { type: Array, default: [] },
    ability: { type: String, default: null },
    rarity: { type: String, default: "Common" },
    isShiny: { type: Boolean, default: false },
    status: { type: String, default: "Healthy" },
    heldItem: { type: String, default: null },
    isEvolved: { type: Boolean, default: false },
    evolvesInto: { type: String, default: null },
    caughtAt: { type: Date, default: Date.now },
    caughtLocation: { type: String, default: "Wild" },
    location: { type: String, enum: ["party", "pc"], default: "pc" }, // New field to track location
});

module.exports = mongoose.model("Pokemon", PokemonSchema);
