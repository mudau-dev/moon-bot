const WEB = process.env.WEB || '';

moon({
  name: 'leaderboard',
  aliases: ['lb'],
  category: 'economy',
  description: 'Open the Moonlight Haven leaderboard.',
  usage: '.leaderboard',
  async execute(sock, jid, sender, args, m, { reply }) {
    const link = `${WEB}/leaderboard`;
    return reply(`🏆 *MOONLIGHT HAVEN LEADERBOARD*\n\nView the top Moonlight Haven members here:\n${link}`);
  },
});
