const config = require("../../config");

moon({
  name: "shop",
  aliases: "[web]",
  category: "general",
  description: "Say hello",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const web = config.WEB;
      const text = `🛒 *MOONLIGHT SHOP* 🛒\n\n` +
        `1. 🍰 Cake - 900 coins\n` +
        `2. 🔫 Pistol - 790 coins\n` +
        `3. 🎟️ Lottery Ticket - 1,500 coins\n` +
        `4. 📝 Shovel - 1,200 coins\n` +
        `5. 🎣 Fishing Rod - 2,500 coins\n` +
        `6. 🌙 Manas (x100) - 2,500 coins\n` +
        `7. 🏰 Guild License - 10,000,000 coins\n\n` +
        `Use \`.buy <index>\` to purchase an item.\n` +
        `Or visit our web shop: ${web}/shop`;
      return reply(text);
    } catch (err) {
      console.error("HY ERROR:", err);
      return reply("❌ Command failed.");
    }
  },
});


moon({
  name: "cshop",
  aliases: "[web]",
  category: "general",
  description: "Say hello",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const web = config.WEB;
      return reply(`${web}shop/cards
> *MOONLIGHT CARDS SHOP* in order to buy cards go to this shop`);
    } catch (err) {
      console.error("HY ERROR:", err);
      return reply("❌ Command failed.");
    }
  },
});