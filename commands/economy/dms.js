const config = require('../../config');

moon({
  name: "dms",
  aliases: ["diamonds", "dm"],
  category: "economy",
  description: "Check your diamond balance",

  async execute(sock, jid, sender, args, m, { findOrCreateWhatsApp, reply, pushName }) {
    try {
      const user = await findOrCreateWhatsApp(sender, pushName);
      if (!user) return reply("❌ Database error.");

      const diamonds = user.diamonds || 0;

      let pfp;
      try {
        pfp = await sock.profilePictureUrl(sender, 'image');
      } catch {
        pfp = config.MOONLIGHT_IMAGE;
      }

      await sock.sendMessage(jid, {
        text: `💎 *DIAMOND BALANCE*\n\n👤 *User:* ${user.username || pushName || sender.split('@')[0]}\n✨ *Total:* ${diamonds.toLocaleString()} Diamonds`,
        contextInfo: {
          externalAdReply: {
            title: "💎 Diamond Wallet",
            body: `Balance: ${diamonds}`,
            thumbnailUrl: pfp,
            sourceUrl: "https://moonlight.com",
            mediaType: 1,
            renderLargerThumbnail: true,
            showAdAttribution: false
          }
        }
      }, { quoted: m });

    } catch (err) {
      console.error("DMS error:", err);
      return reply("❌ Failed to fetch diamond balance.");
    }
  }
});
