const CardMarket = require("../../models/CardMarket");
const { getTierLabel } = require("../../utils/cardGenerator");

moon({
  name: "sinfo",
  category: "cards",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const index = Number.parseInt(args[0], 10) - 1;
      const cards = await CardMarket.find();
      if (!Number.isInteger(index) || index < 0 || !cards[index]) {
        return reply("❌ Invalid card index.");
      }

      const card = cards[index];
      const text = `ℹ️ *CARD INFO*\n\n📛 Name: ${card.cardName}\n💎 Tier: ${getTierLabel(card.cardRarity)}\n💰 Price: $${Number(card.price || 0).toLocaleString()}\n👤 Seller: @${card.sellerId}\n📅 Listed: ${card.listedAt.toDateString()}`;
      return reply(text);
    } catch (err) {
      console.error("SINFO ERROR:", err);
      return reply("❌ Failed to get card info.");
    }
  },
});
