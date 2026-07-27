const CardMarket = require("../../models/CardMarket");
const User = require("../../models/User");
const {
  normalizeTier,
  serializeMarketMedia,
} = require("../../utils/cardGenerator");

moon({
  name: "sellc",
  category: "cards",
  description: "List a card for sale in the market",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const index = Number.parseInt(args[0], 10) - 1;
      const price = Number.parseInt(args[1], 10);
      const userId = sender.split("@")[0];
      const user = await User.findOne({ userId });

      if (!user) return reply("❌ User not found.");
      if (!Number.isInteger(index) || index < 0 || !user.cards[index]) {
        return reply("❌ Invalid card index.");
      }
      if (!Number.isFinite(price) || price <= 0) {
        return reply("❌ Please provide a valid price.");
      }

      const card = user.cards[index];
      await CardMarket.create({
        sellerId: userId,
        cardId: card.cardId,
        cardName: card.name || "Unknown Card",
        cardImage: serializeMarketMedia(card.media),
        cardRarity: normalizeTier(card.tier),
        price,
        listedAt: new Date(),
      });

      user.cards.splice(index, 1);
      user.markModified("cards");
      await user.save();

      return reply(`✅ Listed *${card.name || "Unknown Card"}* for $${price.toLocaleString()} in the market!`);
    } catch (err) {
      console.error("SELLC ERROR:", err);
      return reply("❌ Failed to list card. Internal error.");
    }
  },
});
