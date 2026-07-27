const config = require("../../config");

moon({
  name: "shop",
  aliases: "[web]",
  category: "general",
  description: "Say hello",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const web = config.WEB;
      return reply(`${web}shop
> *MOONLIGHT SHOP* in order to buy items go to this shop`);
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