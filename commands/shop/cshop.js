const CardMarket = require('../../models/CardMarket');

moon({
  name: "cshop",
  aliases: ["cmarket"],
  category: "shop",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const cards = await CardMarket.find();
      if (!cards.length) return reply("🏪 The card shop is currently empty.");

      let text = "🏪 *『CARD MARKET』*\n\n";
      cards.forEach((c, i) => {
        text += `${i + 1}. *${c.cardName}* [${c.cardRarity}]\n💰 Price: ${c.price}\n👤 Seller: @${c.sellerId}\n\n`;
      });
      text += `Use `.cbuy <index>` to buy a card.
        > this show will be fore limited time as shops will be on the web`;

      return reply(text);
    } catch (err) {
      return reply("❌ Failed to fetch card market.");
    }
  }
});
