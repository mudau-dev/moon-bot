const config = require("../../config");
const WEB = config.WEB || "";

moon({
  name: "shop",
  aliases: ["cmarket"],
  category: "shop",
  description: "Replies with shop market link/url.",
  usage: ".shop",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      return reply(`${WEB}/shop
> Visit our website to buy items`);
    } catch (err) {
      console.error(err);
      return reply("An error occurred.");
    }
  }
});

moon({
  name: "cshop",
  aliases: ["card-shop"],
  category: "shop",
  description: "Replies with the card market link.",
  usage: ".cshop",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      return reply(`${WEB}/cards/market
> Visit this page to buy cards`);
    } catch (err) {
      console.error(err);
      return reply("An error occurred.");
    }
  }
});
