const CardMarket = require("../../models/CardMarket");
const { getTierLabel } = require("../../utils/cardGenerator");

moon({
  name: "vs",
  category: "cards",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const userId = sender.split("@")[0];
      const cards = await CardMarket.find({ sellerId: userId });
      if (!cards.length) return reply("📭 You haven't listed any cards for sale.");

      let text = "📋 *YOUR LISTED CARDS*\n\n";
      cards.forEach((card, index) => {
        text += `${index + 1}. *${card.cardName}* [${getTierLabel(card.cardRarity)}]\n💰 Price: $${Number(card.price || 0).toLocaleString()}\n\n`;
      });
      text += "Use `.rc <index>` to remove a listing.";
      return reply(text);
    } catch (err) {
      console.error("VS ERROR:", err);
      return reply("❌ Failed to fetch your listings.");
    }
  },
});
