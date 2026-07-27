const {
  getDefaultPrice,
  getTierLabel,
} = require("../../utils/cardGenerator");

moon({
  name: "rarity",
  aliases: ["rarities", "tiers"],
  category: "cards",
  description: "Show card API tier information",

  async execute(sock, jid, sender, args, m, { reply }) {
    const tiers = ["1", "2", "3", "4", "5", "S"];
    const lines = tiers.map((tier) => {
      const input = tier === "S" ? "S (API tier 6)" : tier;
      return `• ${getTierLabel(tier)} — use \`${input}\` — default value $${getDefaultPrice(tier).toLocaleString()}`;
    });

    return reply(
`🃏 *CARD API TIERS*\n\n${lines.join("\n")}\n\nFuture numeric tiers such as 7 and 8 are supported automatically if the card API adds them.\n\nUse \`.spawn force <tier>\`, \`.clist <tier>\`, or \`.tier <tier>\`.`
    );
  },
});
