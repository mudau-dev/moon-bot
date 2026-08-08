const config = require('../../config');
const OWNER_NAME = process.env.OWNER_NAME || 'Moonlight Haven Team';

moon({
  name: "owner",
  category: "general",
  description: "Show bot owner info",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      const text = `
👑 *OWNER INFORMATION*
━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━
Hello, my name is *${config.BOT_NAME}* and my owner is *${OWNER_NAME}*. I was created to support the Moonlight Haven community.

here are my useful commands you can use
- \`.menu\` to see all my commands
- \`.mods\` to reach out fore support
- \`.casinos\` to get gambling groups
━━━━━━━━━━━━━━━━━━
> ⚠️ Always follow community rules and respect staff decisions.
      `.trim();

      return sock.sendMessage(jid, {
        image: { url: config.MENU_IMAGE },
        caption: text
      }, { quoted: m });

    } catch (err) {
      console.error("Owner cmd error:", err);
      return reply("❌ Failed to load owner info.");
    }
  }
});