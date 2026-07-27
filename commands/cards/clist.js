const Card = require("../../models/Card");
const {
  getTierLabel,
  getTierNumber,
  normalizeTier,
} = require("../../utils/cardGenerator");

moon({
  name: "clist",
  aliases: ["cardslist", "cl"],
  category: "cards",
  description: "List saved cards by tier",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!args[0]) {
        return reply(
`❌ Usage:
.clist <tier> [page]

1 = Tier 1
2 = Tier 2
3 = Tier 3
4 = Tier 4
5 = Tier 5
S = API Tier 6
7, 8... = future API tiers

Example:
.clist 3
.clist S 2`
        );
      }

      const tier = normalizeTier(args[0], null);
      if (!tier || !getTierNumber(tier)) {
        return reply("❌ Invalid tier.");
      }

      const limit = 100;
      let page = Math.max(1, Number.parseInt(args[1], 10) || 1);
      const total = await Card.countDocuments({ tier });
      if (!total) return reply(`❌ No ${getTierLabel(tier)} cards have been saved yet.`);

      const totalPages = Math.ceil(total / limit);
      page = Math.min(page, totalPages);
      const skip = (page - 1) * limit;
      const cards = await Card.find({ tier })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      let text = `*${getTierLabel(tier).toUpperCase()} CARDS LIST*\n\n📦 Total Cards: ${total}\n📄 Page: ${page}/${totalPages}\n\n`;
      cards.forEach((card, index) => {
        text += `${skip + index + 1}. *${card.name} - ${card.cardId}*\n`;
      });
      text += "\nUse: .clist <tier> <page>";

      return reply(text);
    } catch (err) {
      console.error("CLIST ERROR:", err);
      return reply("❌ Failed to load card list.");
    }
  },
});
