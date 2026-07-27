const User = require("../../models/User");
const {
  buildMediaPayload,
  findStoredCard,
  getTierLabel,
  normalizeTier,
  searchCards,
} = require("../../utils/cardGenerator");

moon({
  name: "ci",
  category: "cards",
  description: "View detailed card info",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!args.length) {
        return reply("❌ Usage:\n.ci <card_id>\n.ci <name> <tier 1,2,3,4,5,S>");
      }

      const input = args.join(" ").trim();
      const isLikelyId = args.length === 1 && (input.length <= 20 || input.includes("-"));
      let card = null;

      if (isLikelyId) card = await findStoredCard(input);

      if (!card && args.length >= 2) {
        const requestedTier = normalizeTier(args[args.length - 1], null);
        if (requestedTier) {
          const nameQuery = args.slice(0, -1).join(" ").trim();
          const matches = await searchCards(nameQuery, 25);
          card = matches.find((entry) => normalizeTier(entry.tier) === requestedTier) || null;
        }
      }

      if (!card && !isLikelyId) {
        const exact = await findStoredCard(input);
        if (exact) {
          return reply("❌ What tier is it? Use `.ci <name> <tier>`." );
        }
      }

      if (!card) {
        const similar = await searchCards(input, 5);
        if (similar.length) {
          const suggestion = similar
            .map((entry, index) => `${index + 1}. ${entry.name} (${entry.cardId}) [${getTierLabel(entry.tier)}]`)
            .join("\n");
          return reply(`❌ Card not found. Did you mean:\n\n${suggestion}`);
        }
        return reply("❌ Card not found.");
      }

      const users = await User.find({ "cards.cardId": card.cardId }).limit(10);
      const ownerText = users.length
        ? users.map((user, index) => `${index + 1}. ${user.username || user.pushName || user.name || user.whatsappNumber || user.userId || "Unknown"}`).join("\n")
        : "No owners";

      const text = `> my apologies young one but this commad is under work mode`;

      const payload = buildMediaPayload(card, text);
      if (payload) return sock.sendMessage(jid, payload, { quoted: m });
      return reply(text);
    } catch (err) {
      console.error("CI ERROR:", err);
      return reply("❌ Command failed.");
    }
  },
});
