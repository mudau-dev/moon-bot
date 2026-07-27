const CardMarket = require('../../models/CardMarket');
const User = require('../../models/User');

moon({
  name: "cbuy",
  category: "shop",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const index = parseInt(args[0]) - 1;
      const cards = await CardMarket.find();
      if (isNaN(index) || !cards[index]) return reply("❌ Invalid card index.");

      const card = cards[index];
      const buyerId = sender.split('@')[0];
      const buyer = await User.findOne({ userId: buyerId });

      if (!buyer) return reply("❌ User not found.");
      if (buyer.balance < card.price) return reply("❌ You don't have enough balance.");

      buyer.balance -= card.price;

      // FIX: Use correct field names matching the card collection schema
      // card.cardImage is stored as base64 string in CardMarket
      // card.cardRarity maps to tier, card.cardImage maps to media
      buyer.cards.push({
        cardId: card.cardId,
        name: card.cardName,
        tier: card.cardRarity,
        media: card.cardImage !== "no-image" ? card.cardImage : undefined,
        obtainedAt: new Date()
      });

      buyer.markModified("cards");
      await buyer.save();

      const seller = await User.findOne({ userId: card.sellerId });
      if (seller) {
        seller.balance += card.price;
        await seller.save();
      }

      await CardMarket.findByIdAndDelete(card._id);
      return reply(`✅ Successfully bought *${card.cardName}* [${card.cardRarity}] for ${card.price}!`);
    } catch (err) {
      console.error("CBUY ERROR:", err);
      return reply("❌ Transaction failed.");
    }
  }
});
