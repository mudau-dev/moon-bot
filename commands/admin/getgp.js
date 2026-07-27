const config = require('../../config');

moon({
  name: "getgp",
  category: "group",
  description: "Get group profile picture",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      if (!jid.endsWith("@g.us")) {
        return reply("❌ Group only.");
      }

      const meta = await sock.groupMetadata(jid);

      // ---------------- BOT CHECK ----------------
      const bot = meta.participants.find(p => p.id === config.BOT_JID);

      const isBotAdmin =
        bot?.admin === "admin" ||
        bot?.admin === "superadmin";

      if (!isBotAdmin) {
        return reply("❌ Bot must be admin.");
      }

      // ---------------- GET GROUP PICTURE ----------------
      let url;

      try {
        url = await sock.profilePictureUrl(jid, "image");
      } catch (err) {
        return reply("❌ No group profile image found.");
      }

      return sock.sendMessage(jid, {
        image: { url },
        caption: "🖼️ *Group Profile Picture*"
      }, { quoted: m });

    } catch (err) {
      console.error("getgp error:", err);
      return reply("❌ Failed to get group image.");
    }
  }
});