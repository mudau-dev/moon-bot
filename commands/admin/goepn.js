const config = require('../../config');

moon({
  name: "gopen",
  category: "group",
  description: "Open group for everyone",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const metadata = await sock.groupMetadata(jid);

      const user = metadata.participants.find(p => p.id === sender);
      const bot = metadata.participants.find(p => p.id === config.BOT_JID);

      if (!user || (user.admin !== "admin" && user.admin !== "superadmin")) {
        return reply("❌ You must be a group admin.");
      }

      if (!bot || (bot.admin !== "admin" && bot.admin !== "superadmin")) {
        return reply("❌ Bot must be admin.");
      }

      await sock.groupSettingUpdate(jid, "not_announcement");

      return reply("🔓 Group is now *OPEN*.");
    } catch (err) {
      console.error(err);
      return reply("❌ Failed to open group.");
    }
  }
});