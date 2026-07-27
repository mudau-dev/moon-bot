// handler/moon.js
const commands = new Map();

function moon(cmd) {
  if (!cmd.name || typeof cmd.execute !== 'function') {
    console.error('[MOON] Invalid command:', cmd.name);
    return;
  }
  commands.set(cmd.name, cmd);
  // register aliases
  if (cmd.aliases && Array.isArray(cmd.aliases)) {
    for (const alias of cmd.aliases) {
      commands.set(alias, cmd);
    }
  }
}

function getCommand(name) {
  return commands.get(name);
}

module.exports = {
  moon,
  getCommand,
  commands
};
