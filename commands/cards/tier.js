const { findOrCreateWhatsApp } = require("../../database/users");
const {
  getTierKeys,
  getTierLabel,
  getTierNumber,
  normalizeTier,
} = require("../../utils/cardGenerator");

moon({
  name: "tier",
  category: "cards",
  description: "View cards by tier",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const user = await findOrCreateWhatsApp(sender);
      if (!Array.isArray(user.cards) || user.cards.length === 0) {
        return reply("❌ You don't have any cards.");
      }

      const filterTier = args[0] ? normalizeTier(args[0], null) : null;
      if (args[0] && (!filterTier || !getTierNumber(filterTier))) {
        return reply("❌ Invalid tier. Use 1, 2, 3, 4, 5, S, or a future numeric tier such as 7.");
      }

      const readMore = "\u200e".repeat(4000);
      let text = `🃏 *Tier Filtered Collection*\n\n${readMore}\n📦 Total Cards: ${user.cards.length}\n`;

      const filtered = filterTier
        ? user.cards.filter((card) => normalizeTier(card.tier) === filterTier)
        : user.cards;

      if (filterTier && filtered.length === 0) {
        return reply(`❌ No cards found in ${getTierLabel(filterTier)}.`);
      }

      if (filterTier) {
        text += `\n🎯 *${getTierLabel(filterTier)} Cards:*\n\n`;
        filtered.forEach((card, index) => {
          text += `${index + 1}. 🃏 ${card.name}\n`;
        });
      } else {
        text += "\n📊 *Grouped by Tier*\n";
        const groups = new Map(getTierKeys(filtered).map((tier) => [tier, []]));
        filtered.forEach((card) => {
          const tier = normalizeTier(card.tier);
          if (!groups.has(tier)) groups.set(tier, []);
          groups.get(tier).push(card.name);
        });

        for (const tier of getTierKeys([...groups.keys()])) {
          const cards = groups.get(tier) || [];
          text += `\n🏷️ *${getTierLabel(tier)}*\n`;
          if (!cards.length) {
            text += "- None\n";
          } else {
            cards.forEach((name, index) => {
              text += `*${index + 1}. ${name}*\n`;
            });
          }
        }
      }

      return reply(text, { mentions: [sender] });
    } catch (err) {
      console.error("TIER ERROR:", err);
      return reply("❌ Failed to load tier list.");
    }
  },
});
