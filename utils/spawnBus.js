const EventEmitter = require("events");

const spawnBus = new EventEmitter();

// optional safety (prevents memory leak warnings in multi-bot setups)
spawnBus.setMaxListeners(50);

module.exports = spawnBus;