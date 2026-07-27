const User = require('../../models/User');
const EventProgress = require('../../models/EventProgress');
const { userCache } = require('../../database/users');
const { mentionTag } = require('../../handlers/_shared');

moon({
  name: "del-user",
  category: "owner",
  roles: ["True Owner", "CDC"],
  description: "Permanently delete a user from the bot database",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      let target = args[0];

      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }

      if (!target) {
        return reply("❌ Tag, reply, or provide the number of the user to delete.");
      }

      const userId = target.split("@")[0];
      const whatsappNumber = userId + "@s.whatsapp.net";

      // Check if user exists
      const user = await User.findOne({ $or: [{ userId }, { whatsappNumber }] });
      
      if (!user) {
        return reply("❌ User not found in database.");
      }

      // Protection
      if (user.role === "True Owner" || user.role === "CDC") {
        return reply("❌ You cannot delete a True Owner or CDC account.");
      }

      // Delete user and their event progress
      await User.deleteOne({ _id: user._id });
      await EventProgress.deleteOne({ userId: whatsappNumber });

      // Clear cache
      if (userCache) {
        userCache.delete(whatsappNumber);
        userCache.delete(userId);
      }

      const tag = mentionTag(whatsappNumber);

      return await sock.sendMessage(jid, {
        text: `🗑️ *USER DELETED* 🗑️\n\n👤 Target: ${tag}\n✅ Account and event progress have been wiped from the database.`,
        mentions: [whatsappNumber]
      }, { quoted: m });

    } catch (err) {
      console.error("DEL-USER ERROR:", err);
      return reply("❌ Error deleting user.");
    }
  }
});
