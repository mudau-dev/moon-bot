const config = require('../../config');
const User = require('../../models/User');

moon({
  name: 'addbot',
  aliases: ['dbot'],
  category: 'general',
  description: 'Request bot for your group',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const senderNumber = sender.split('@')[0];
      const sub = args[0];

      const readMore = String.fromCharCode(8206).repeat(4001);

      // =========================
      // 📌 MAIN INFO PANEL
      // =========================
      if (!sub || sub === "help") {
        return sock.sendMessage(jid, {
          image: { url: config.MOONLIGHT_IMAGE },
          caption:
`🌙 *𝚳OO𝚴𝐋𝚰𝐆𝚮𝚻 H𝚫V𝚵N BOT REQUEST*
${readMore}

📌 *Requirements*
• 95+ members  
• 60% active members  
• At least 1 admin active  
• Bot must be admin  

📌 *Rules*
• No NSFW content  
• No spam groups  
• Follow WhatsApp rules  
• Do NOT force-add bot  

📌 *How to request a bot*
.addbot <group link> <reason>

📌 *Example*
.addbot https://chat.whatsapp.com/XXXX active group with daily chat`
        }, { quoted: m });
      }

      // =========================
      // 📤 CREATE REQUEST
      // =========================
      const groupLink = args[0];
      const reason = args.slice(1).join(" ").trim();

      if (!groupLink || !groupLink.includes("chat.whatsapp.com")) {
        return reply("❌ Invalid group link.");
      }

      if (!reason) {
        return reply("❌ Provide a reason.");
      }

      const { findOrCreateWhatsApp } = require("../../database/users");
      const userDoc = await findOrCreateWhatsApp(sender);
      
      if (!userDoc) {
        return reply("❌ User not found.");
      }

      const exists = userDoc.botRequests.find(r => r.groupLink === groupLink);

      if (exists) {
        return reply("⚠️ You have already requested the bot for this group.");
      }

      userDoc.botRequests.push({
        groupLink,
        reason,
        status: "pending",
        createdAt: new Date()
      });

      await userDoc.save();

      return reply("✅ Your bot request has been submitted successfully. Our team will review it soon.");

    } catch (err) {
      console.error("ADDBOT ERROR:", err);
      return reply("❌ Command failed.");
    }
  }
});
