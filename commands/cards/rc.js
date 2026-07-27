const CardMarket = require("../../models/CardMarket");
const User = require("../../models/User");
const {
  deserializeMarketMedia,
  inferMediaType,
  normalizeTier,
} = require("../../utils/cardGenerator");

moon({
  name: "rc",
  category: "cards",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const index = Number.parseInt(args[0], 10) - 1;
      const userId = sender.split("@")[0];
      const cards = await CardMarket.find({ sellerId: userId });

      if (!Number.isInteger(index) || index < 0 || !cards[index]) {
        return reply("❌ Invalid index.");
      }

      const card = cards[index];
      const user = await User.findOne({ userId });
      if (!user) return reply("❌ User not found.");

      const media = deserializeMarketMedia(card.cardImage);
      user.cards.push({
        cardId: card.cardId,
        name: card.cardName,
        tier: normalizeTier(card.cardRarity),
        media,
        mediaType: inferMediaType(media),
        obtainedAt: new Date(),
      });

      user.markModified("cards");
      await user.save();
      await CardMarket.findByIdAndDelete(card._id);

      return reply(`✅ Successfully removed *${card.cardName}* from the market.`);
    } catch (err) {
      console.error("RC ERROR:", err);
      return reply("❌ Failed to remove card.");
    }
  },
});
