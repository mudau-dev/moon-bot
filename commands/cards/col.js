const { findOrCreateWhatsApp } = require("../../database/users");
const { getTierLabel } = require("../../utils/cardGenerator");

moon({
  name: "col",
  category: "cards",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const user = await findOrCreateWhatsApp(sender);
      if (!Array.isArray(user.cards) || user.cards.length === 0) {
        return reply("❌ You don't have any cards.");
      }

      const readMore = "\u200e".repeat(4000);
      let text = `🃏 *Your Card Collection*\n\n${readMore}\n👤 @${sender.split("@")[0]}\n📦 Total: ${user.cards.length}\n\n`;

      user.cards.forEach((card, index) => {
        text += `${index + 1}. 🃏 *${card.name}* (${getTierLabel(card.tier)})\n`;
      });

      return reply(text, { mentions: [sender] });
    } catch (err) {
      console.error("COL ERROR:", err);
      return reply("❌ Failed to load.");
    }
  },
});
