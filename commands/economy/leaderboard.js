const config = require('../../config');

moon({
  name: 'leaderboard,
  aliases: ['lb'],
  category: 'economy,
  description: 'Start your Moonlight Legacy journey on the website.',
  async execute(sock, jid, sender, args, m, { reply }) {
    const link = `${config.WEB}/leaderboard`;
    return reply(
      `${link}` +
      `> follow this link to see pur top moonlight haven members`
      );
   },
});
