const config = require('../../config');

moon({
  name: "kick",
  category: "group",
  description: "Kick a user from group",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const contextInfo = m.message?.extendedTextMessage?.contextInfo;
      const target = contextInfo?.mentionedJid?.[0] || contextInfo?.participant;

      if (!target) return reply("❌ Mention or reply to a user.");

      const metadata = await sock.groupMetadata(jid);

      const user = metadata.participants.find(p => p.id === sender);
      const bot = metadata.participants.find(p => p.id === config.BOT_JID);

      if (!user || (user.admin !== "admin" && user.admin !== "superadmin")) {
        return reply("❌ You must be admin.");
      }

      if (!bot || (bot.admin !== "admin" && bot.admin !== "superadmin")) {
        return reply("❌ Bot must be admin.");
      }

      await sock.groupParticipantsUpdate(jid, [target], "remove");

      return reply(`🚫 Kicked @${target.split('@')[0]}`, { mentions: [target] });

    } catch (err) {
      console.error(err);
      return reply("❌ Failed to kick user.");
    }
  }
});