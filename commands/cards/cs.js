const { findOrCreateWhatsApp } = require("../../database/users");

moon({
  name: "cs",
  aliases: ["cardseries"],
  roles: [],
  category: "cards",
  description: "Search your collection by series",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const search = args.join(" ").trim();

      if (!search) {
        return reply("❌ Usage: .cs <series>");
      }

      const user = await findOrCreateWhatsApp(sender);

      if (!user.cards || user.cards.length === 0) {
        return reply("❌ You don't own any cards.");
      }

      const results = user.cards.filter(card =>
        String(card.series || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      );

      if (results.length === 0) {
        return reply(`❌ No cards found matching "${search}".`);
      }

      let text = `🎴 *Series search: ${search}*\n`;
      text += `> Found *${results.length}* card(s).\n\n`;

      results.forEach((card, index) => {
        text += `${index + 1}. 🎴 ${card.name}\n`;
        text += `*Tier:* ${card.tier}\n`;
        text += `*Index:* ${card.cardId}\n\n`;
      });

      return reply(text.trim());

    } catch (err) {
      console.error("CS ERROR:", err);
      return reply("❌ Failed to search your collection.");
    }
  },
});