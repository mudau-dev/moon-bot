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

      const meta = await sock.groupMetadata(jid);

      const bot = meta.participants.find(
        p => p.id === config.BOT_JID || p.id === sock.user.id
      );

      const isBotAdmin =
        bot?.admin === "admin" ||
        bot?.admin === "superadmin";

      if (!isBotAdmin) {
        return reply("❌ Bot must be admin to get invite link.");
      }

      const code = await sock.groupInviteCode(jid);
      const link = `https://chat.whatsapp.com/${code}`;

      await sock.sendMessage(
        jid,
        {
          text: `🔗 *Group Invite Link*

📌 *${meta.subject}*

${link}

⚠️ Share carefully.`,
          linkPreview: true
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("invite error:", err);
      reply("❌ Failed to fetch invite link.");
    }
  }
});
