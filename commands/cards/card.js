const { findOrCreateWhatsApp } = require("../../database/users");
const {
  buildMediaPayload,
  getTierLabel,
} = require("../../utils/cardGenerator");

moon({
  name: "card",
  category: "Cards",
  description: "Show a card from your collection",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const user = await findOrCreateWhatsApp(sender);
      if (!user || !Array.isArray(user.cards) || user.cards.length === 0) {
        return reply("❌ You have no cards.");
      }

      if (!args[0]) return reply("❌ Usage: .card <index>");
      const index = Number.parseInt(args[0], 10);
      if (!Number.isInteger(index) || index < 1 || index > user.cards.length) {
        return reply("❌ Invalid card number.");
      }

      const card = user.cards[index - 1];
      const caption = `∘₊✧──────✧₊∘
🎴 *MN CARD VIEW*
∘₊✧──────✧₊∘

*Name:* ${card.name || "Unknown"}
*ID:* ${card.cardId || "Unknown"}
*Tier:* ${getTierLabel(card.tier)}
*Value:* $${Number(card.price || 0).toLocaleString()}

*Desc:*
${card.description || "No description"}

∘₊✧──────✧₊∘`;

      const payload = buildMediaPayload(card, caption);
      if (payload) {
        return sock.sendMessage(jid, payload, { quoted: m });
      }

      return reply(caption);
    } catch (err) {
      console.error("CARD ERROR:", err);
      return reply("❌ Failed to show card.");
    }
  },
});
