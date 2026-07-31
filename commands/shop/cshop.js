const WEB = config.WEB;

moon({
  name: 'shop',
  aliases: ["cmarket"],
  category: "shop",
  description: 'Replies with shop market link/url.',
  usage: '.shop',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      return reply('${WEB}/shop\n> visit our website here in order to buy items');
    } catch (err) {
      console.error(err);
      return reply('❌ An error occurred.');
    }
  }
});

moon({
  name: 'cshop',
  aliases: 'card-shop'],
  category: 'shop',
  description: 'Replies with hy.',
  usage: '.hello',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      return reply('${WEB}/cards/market\n> visit this page in order to buy cards ');
    } catch (err) {
      console.error(err);
      return reply('❌ An error occurred.');
    }
  }
});
