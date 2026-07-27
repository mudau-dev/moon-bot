const { findOrCreateWhatsApp } = require("../../database/users");
const { getTierLabel } = require("../../utils/cardGenerator");

moon({
  name: "delc",
  aliases: ["deletecard", "removec"],
  category: "cards",
  description: "Remove a card from your collection by index",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!args[0]) {
        return reply("❌ Usage: .delc <card index>\n\nExample:\n.delc 3\n\nUse *.col* to see your cards and their indexes.");
      }

      const index = Number.parseInt(args[0], 10) - 1;
      if (!Number.isInteger(index) || index < 0) {
        return reply("❌ Invalid card index. Please provide a valid number.");
      }

      const user = await findOrCreateWhatsApp(sender);
      if (!user.cards?.length) return reply("❌ You don't have any cards in your collection.");
      if (index >= user.cards.length) {
        return reply(`❌ Invalid index. You only have ${user.cards.length} card(s). Use *.col* to check.`);
      }

      const [card] = user.cards.splice(index, 1);
      user.markModified("cards");
      await user.save();

      return reply(`🗑️ *CARD REMOVED*\n\n🃏 *${card.name || "Unknown Card"}*\n⭐ ${getTierLabel(card.tier)}\n\nCard has been permanently removed from your collection.`);
    } catch (err) {
      console.error("DELC ERROR:", err);
      return reply("❌ Failed to remove card. Please try again.");
    }
  },
});
