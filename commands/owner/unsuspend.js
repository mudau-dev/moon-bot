const { unsuspendUser } = require('../../utils/modTools');
const { isMod } = require('../../database/users');

moon({
  name: "unsuspend",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Unsuspend a user",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
     
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
      const rawTarget = mentioned || quoted || args[0];
      
      if (!rawTarget) {
        return reply("❌ Please mention a user, reply to a user, or provide their number.");
      }
      
      const targetNumber = String(rawTarget).replace(/[^0-9]/g, '');
      const target = `${targetNumber}@s.whatsapp.net`;
      
      const res = await unsuspendUser(target);
      if (!res.ok) return reply(res.message);
      
      return sock.sendMessage(jid, {
        text: `✅ *USER UNSUSPENDED*\n👤 *Target:* @${targetNumber}`,
        mentions: [target]
      }, { quoted: m });
    } catch (err) {
      console.error("UNSUSPEND ERROR:", err);
      return reply("❌ Failed to unsuspend user.");
    }
  }
});
