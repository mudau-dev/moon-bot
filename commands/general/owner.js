const config = require('../../config');

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
hy my name is *${config.BOT_NAME}* my owner is *${config.OWNER_NAME}* .i was created to help with Moonlight haven community.where all things that happens at night dies in the morning 

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