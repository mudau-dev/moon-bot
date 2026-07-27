const CardMarket = require('../../models/CardMarket');

moon({
  name: "sinfo",
  category: "shop",
  description: "Get detailed information about a card listed in the shop",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const index = parseInt(args[0]) - 1;
      const cards = await CardMarket.find().sort({ createdAt: 1 });

      if (isNaN(index) || index < 0 || !cards[index]) {
        return reply("❌ Invalid card index. Use `.cshop` to see available cards.");
      }

      const c = cards[index];
      const listedDate = c.createdAt ? new Date(c.createdAt).toDateString() : "Unknown";

      const text = `📋 *CARD INFO*

📛 *Name:* ${c.cardName}
💎 *Rarity:* \`${c.cardRarity}\`
💰 *Price:* ${c.price}
👤 *Seller:* @${c.sellerId}
📅 *Listed:* ${listedDate}`;

      return sock.sendMessage(jid, {
        text,
        mentions: [`${c.sellerId}@s.whatsapp.net`]
      }, { quoted: m });
    } catch (err) {
      console.error("SINFO ERROR:", err);
      return reply("❌ Failed to get card info.");
    }
  }
});
