const config = require('../../config');
const Giveaway = require('../../models/athers/Giveaway');

moon({
  name: "cm",
  category: "economy",
  description: "Claim giveaway prize",

  async execute(sock, jid, sender, args, message, { reply, findOrCreateWhatsApp, pushName }) {
    try {

      const id = args[0];
      if (!id) {
        return reply("❌ Usage: .cm <id>");
      }

      // ---------------- FIND ACTIVE GIVEAWAY ----------------
      const giveaway = await Giveaway.findOne({
        id,
        claimed: false,
        expiresAt: { $gt: Date.now() }
      });

      if (!giveaway) {
        return reply("❌ No active giveaway.");
      }

      // ---------------- CLAIM LOCK ----------------
      giveaway.claimed = true;
      giveaway.winner = sender;
      await giveaway.save();

      // ---------------- USER UPDATE ----------------
      const user = await findOrCreateWhatsApp(sender, pushName);
      user.balance = (user.balance || 0) + (giveaway.amount || 0);
      await user.save();

      // ---------------- PROFILE ----------------
      let pfp;
      try {
        pfp = await sock.profilePictureUrl(sender, 'image');
      } catch {
        pfp = config.MOONLIGHT_IMAGE;
      }

      const text = `
🏆 *WE HAVE A WINNER!*

🎉 *@${sender.split('@')[0]}* claimed the prize!

💰 *Won:* ${giveaway.amount.toLocaleString()} coins
      `.trim();

      // ---------------- SEND RESULT ----------------
      await sock.sendMessage(jid, {
        text,
        mentions: [sender],
        contextInfo: {
          externalAdReply: {
            title: "🏆 Giveaway Winner",
            body: "Congratulations!",
            thumbnailUrl: pfp,
            sourceUrl: "https://moonlight.com",
            mediaType: 2,
            renderLargerThumbnail: false,
            showAdAttribution: false
          }
        }
      }, { quoted: message });

    } catch (err) {
      console.error("Claim error:", err);
      return reply("❌ Failed to claim reward.");
    }
  }
});