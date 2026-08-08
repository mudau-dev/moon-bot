const WEB = process.env.WEB || '';

moon({
  name: 'shop',
  aliases: ['cmarket'],
  category: 'shop',
  description: 'Open the Moonlight Haven shop.',
  usage: '.shop',
  async execute(sock, jid, sender, args, m, { reply }) {
    return reply(`🛒 *MOONLIGHT HAVEN SHOP*\n\nBrowse Poké Balls and other items here:\n${WEB}/shop`);
  },
});

moon({
  name: 'cshop',
  aliases: ['card-shop'],
  category: 'shop',
  description: 'Open the card market.',
  usage: '.cshop',
  async execute(sock, jid, sender, args, m, { reply }) {
    return reply(`🎴 *MOONLIGHT HAVEN CARD MARKET*\n\nBrowse listed cards here:\n${WEB}/cards/market`);
  },
});
