const Card = require("../../models/Card");
const User = require("../../models/User");
const { fetchCardsBySeries, getTierLabel } = require("../../utils/cardGenerator");

moon({
  name: "sc",
  category: "Cards",
  description: "Search saved cards by name",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!args.length) return reply("❌ Give a name to search.\nExample: .sc rim");

      let page = 1;
      if (!Number.isNaN(Number(args[args.length - 1]))) {
        page = Math.max(1, Number.parseInt(args.pop(), 10));
      }

      const query = args.join(" ").trim();
      if (!query) return reply("❌ Invalid search query.");

      const limit = 10;
      const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapeRegex(query), "i");
      const filter = { name: { $regex: regex }, enabled: true };
      let total = await Card.countDocuments(filter);
      if (!total) {
        try {
          await fetchCardsBySeries(query, 200);
          total = await Card.countDocuments(filter);
        } catch (error) {
          console.warn("SC API fallback failed:", error.message);
        }
      }
      if (!total) return reply(`❌ No cards found for "${query}".`);

      const pages = Math.ceil(total / limit);
      page = Math.min(page, pages);
      const skip = (page - 1) * limit;
      const [cards, users] = await Promise.all([
        Card.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
        User.find({}, "userId username cards"),
      ]);

      const ownerMap = new Map();
      users.forEach((user) => {
        (user.cards || []).forEach((card) => {
          if (!card?.cardId) return;
          if (!ownerMap.has(card.cardId)) ownerMap.set(card.cardId, []);
          ownerMap.get(card.cardId).push(user.username || user.userId || "Unknown");
        });
      });

      let text = `ㅤㅤ∘]───❀───[∘
*∘₊✧ MN CARD SEARCH* ❀
     ∘]───❀───[∘

𝗤𝘂𝗲𝗿𝘆: ${query}
𝗣𝗮𝗴𝗲: ${page}/${pages}
𝗧𝗼𝘁𝗮𝗹: ${total}

━━━━━━━━━━━━━━━`;

      cards.forEach((card, index) => {
        const owners = ownerMap.get(card.cardId) || [];
        const ownerList = owners.length
          ? owners.slice(0, 5).map((name) => `• ${name}`).join("\n")
          : "None";
        const extra = owners.length > 5 ? `\n+${owners.length - 5} more` : "";

        text += `\n\n🃏 ${skip + index + 1}. ${card.name}
⭐ 𝗧𝗶𝗲𝗿: ${getTierLabel(card.tier)}
💰 𝗣𝗿𝗶𝗰𝗘: $${Number(card.price || 0).toLocaleString()}
🆔 𝗜𝗗: ${card.cardId}

👤 𝗢𝘄𝗻𝗲𝗿𝘀: ${owners.length}
${ownerList}${extra}`;
      });

      text += "\n\n  *❀────⋆⋅∘⋅⋆────❀*\n *USE .CI <NAME/ID>*\n  *❀────⋆⋅∘⋅⋆────❀*\n      ∘──────∘";
      return reply(text);
    } catch (err) {
      console.error("SC ERROR:", err);
      return reply("❌ Search failed.");
    }
  },
});
