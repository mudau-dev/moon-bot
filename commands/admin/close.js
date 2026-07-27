const config = require('../../config');

moon({
  name: "gclose",
  category: "group",
  description: "Close group for admins only",

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

      await sock.groupSettingUpdate(jid, "announcement");

      return reply("🔒 Group is now *CLOSED*.");
    } catch (err) {
      console.error(err);
      return reply("❌ Failed to close group.");
    }
  }
});