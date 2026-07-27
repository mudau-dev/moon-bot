const User = require("../../models/User");
const {
  getTierLabel,
  getTierNumber,
} = require("../../utils/cardGenerator");

moon({
  name: "deck",
  aliases: ["dk", "mycards"],
  category: "cards",
  description: "View your card deck",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const user = await User.findOne({
        $or: [
          { whatsappNumber: sender },
          { userId: sender.split("@")[0] },
        ],
      });

      if (!user?.cards?.length) {
        return reply("❌ You don't have any cards in your deck yet.");
      }

      const limit = 12;
      let page = Number.parseInt(args[0], 10) || 1;
      const totalCards = user.cards.length;
      const totalPages = Math.ceil(totalCards / limit);
      page = Math.max(1, Math.min(page, totalPages));

      const start = (page - 1) * limit;
      const deckSlice = user.cards.slice(start, start + limit);
      const readMore = String.fromCharCode(8206).repeat(4001);
      let text = "🎴 *YOUR CURRENT DECK* 🎴\n";
      text += `> Page ${page}/${totalPages} | Total cards: ${totalCards}\n`;
      text += `${readMore}\n\n`;

      for (let index = 0; index < deckSlice.length; index += 1) {
        const card = deckSlice[index];
        const holders = await User.find({ "cards.cardId": card.cardId }).limit(3);
        const holderNames = holders
          .map((entry) => {
            const name = entry.username || entry.pushName || entry.name;
            return name && name !== "Unknown"
              ? name
              : `@${entry.userId || entry.whatsappNumber?.split("@")[0] || "unknown"}`;
          })
          .join(", ");

        const stars = "⭐".repeat(Math.max(1, Math.min(getTierNumber(card.tier) || 1, 8)));
        text += `${start + index + 1}. *${card.name}*\n`;
        text += `*Tier:* ${getTierLabel(card.tier)} ${stars}\n`;
        text += `*Holders:* ${holderNames || "None"}\n\n`;
      }

      return reply(text);
    } catch (err) {
      console.error("DECK ERROR:", err);
      return reply("❌ Failed to load your deck.");
    }
  },
});
