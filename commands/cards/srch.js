const {
  buildMediaPayload,
  findStoredCard,
  getTierLabel,
  searchCards,
} = require("../../utils/cardGenerator");

moon({
  name: "search",
  category: "Cards",
  description: "Search a saved card by name, series, or ID",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const query = args.join(" ").trim();
      if (!query) return reply("❌ Give a card name, series, or ID.\nExample: .search rimuru");

      let card = await findStoredCard(query);
      if (!card) {
        const matches = await searchCards(query, 5);
        card = matches[0] || null;
      }

      if (!card) {
        return reply("❌ Card not found. Cards appear here after they are fetched and saved from the card API by a spawn.");
      }

      const text = `ㅤㅤ∘]───❀───[∘
*∘₊✧ MN CARD INFO* ❀
     ∘]───❀───[∘

𝗡𝗮𝗺𝗲: ${card.name}
𝗧𝗶𝗲𝗿: ${getTierLabel(card.tier)}
𝗣𝗿𝗶𝗰𝗲: $${Number(card.price || 0).toLocaleString()}
𝗜𝗗: ${card.cardId}
𝗦𝗲𝗿𝗶𝗲𝘀: ${card.series || "Unknown"}

  *❀────⋆⋅∘⋅⋆────❀*
 *CARD PREVIEW*
  *❀────⋆⋅∘⋅⋆────❀*
      ∘──────∘`;

      const payload = buildMediaPayload(card, text);
      if (payload) return sock.sendMessage(jid, payload, { quoted: m });
      return reply(text);
    } catch (err) {
      console.error("SEARCH ERROR:", err);
      return reply("❌ Search failed.");
    }
  },
});
