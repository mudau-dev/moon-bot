const config = require('../../config');

moon({
  name: "invite",
  category: "group",
  description: "Get group invite link",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      if (!jid.endsWith("@g.us")) {
        return reply("❌ Group only.");
      }

      // ---------------- BOT CHECK ONLY ----------------
      const meta = await sock.groupMetadata(jid);

      const bot = meta.participants.find(p => p.id === config.BOT_JID);

      const isBotAdmin =
        bot?.admin === "admin" ||
        bot?.admin === "superadmin";

      if (!isBotAdmin) {
        return reply("❌ Bot must be admin to get invite link.");
      }

      // ---------------- GET INVITE LINK ----------------
      const code = await sock.groupInviteCode(jid);
      const link = `https://chat.whatsapp.com/${code}`;

      return sock.sendMessage(jid, {
        text: `${link} 
        - here is the group link`
      }, { quoted: m });

    } catch (err) {
      console.error("invite error:", err);
      return reply("❌ Failed to fetch invite link.");
    }
  }
});
