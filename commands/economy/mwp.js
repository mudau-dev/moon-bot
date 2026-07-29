const { findOrCreateWhatsApp } = require('../../database/users');
const config = require('../../config');

moon({
  name: "mwp",
  category: "economy",
  description: "View your Moonlight Haven web information",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const userDoc = await findOrCreateWhatsApp(sender);
      if (!userDoc) return reply("❌ User not found.");
      
      const user = userDoc.toObject();
      const isRegistered = user.moonId && !user.moonId.startsWith("moon_");

      if (!isRegistered) {
        return reply("❌ You are not registered in Moonlight Haven. Please visit " + config.WEB + " to register.");
      }

      const maskedPassword = user.webPassword ? "**********" : "Not Set";
      
      let text = `🌐 *MOONLIGHT WEB PROFILE* 🌐\n\n`;
      text += `🆔 *Moon ID:* ${user.moonId}\n`;
      text += `👤 *Username:* ${user.username}\n`;
      text += `🔑 *Password:* ${maskedPassword}\n`;
      text += `📱 *Phone:* ${user.phoneNumber || user.whatsappNumber?.split('@')[0] || "N/A"}\n`;
      text += `🎨 *Avatar:* ${user.avatarUrl ? "Set ✅" : "Not Set ❌"}\n`;
      text += `🖼️ *Banner:* ${user.bannerUrl ? "Set ✅" : "Not Set ❌"}\n`;
      text += `✨ *Frame:* ${user.profileFrame || "classic"}\n\n`;
      text += `🔗 *Link:* ${config.WEB}/user/${user.moonId}\n\n`;
      text += `> You can update your information at ${config.WEB}/profile/edit`;

      if (user.avatarUrl) {
        return await sock.sendMessage(jid, { 
          image: { url: user.avatarUrl }, 
          caption: text 
        }, { quoted: m });
      } else {
        return reply(text);
      }
    } catch (err) {
      console.error("MWP ERROR:", err);
      return reply("❌ Error fetching web information.");
    }
  }
});
