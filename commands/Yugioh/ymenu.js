// commands/Yugioh/ymenu.js
// ─────────────────────────────────────────────────────────────────────────────
// .ymenu
// Display the Yu-Gi-Oh commands menu.
// ─────────────────────────────────────────────────────────────────────────────

const config = require('../../config');

moon({
  name: 'ymenu',
  aliases: ['yugioh', 'ygomenu'],
  category: 'Yu-gi-oh',
  description: 'Display the Yu-Gi-Oh commands menu',
  usage: '.ymenu',

  async execute(sock, jid, sender, args, m, { reply, commands }) {
    try {
      const seen = new Set();
      const cmds = [];

      for (const [, cmd] of commands) {
        if (
          String(cmd.category || '').toLowerCase() === 'yu-gi-oh' &&
          !seen.has(cmd.name)
        ) {
          seen.add(cmd.name);
          cmds.push(cmd);
        }
      }

      cmds.sort((a, b) => a.name.localeCompare(b.name));

      const prefix = config.PREFIX || '.';

      let text =
`🃏 *Yu-Gi-Oh Commands*

📚 Total Commands: *${cmds.length}*

`;

      for (const cmd of cmds) {
        text += `• ${prefix}${cmd.name}`;

        if (cmd.description) {
          text += `\n> ${cmd.description}`;
        }

        text += `\n\n`;
      }

      text +=
`💡 *Quick Start*

> 🎴 ${prefix}yspawn - Spawn a card
> 🎯 ${prefix}yclaim <id> - Claim a card
> 📖 ${prefix}yi <name> - Search for a card`;

      if (config.MOONLIGHT_IMAGE) {
        return sock.sendMessage(
          jid,
          {
            image: { url: config.MENU_IMAGE },
            caption: text
          },
          { quoted: m }
        );
      }

      return reply(text);

    } catch (err) {
      console.error('[YMENU ERROR]', err);

      return reply(
        `❌ Failed to load the Yu-Gi-Oh menu.`
      );
    }
  }
});