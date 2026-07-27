const { money, parseBet, validateBet, getUser, win, lose, pick } = require('./_shared');

moon({
  name: 'casino',
  category: 'gambling',
  usage: '.casino <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 0);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad + '\nUsage: .casino <amount|all|half>');
    const games = ['roulette table', 'slot room', 'vip table', 'lucky wheel'];
    const roll = Math.random();
    const place = pick(games);
    if (roll < 0.08) {
      const profit = await win(user, bet, 4);
      return reply(`🏦 *Casino jackpot!*\n\n🎯 Table: ${place}\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    if (roll < 0.42) {
      const profit = await win(user, bet, 1.5);
      return reply(`🏦 *Casino win!*\n\n🎯 Table: ${place}\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`🏦 *Casino loss!*\n\n🎯 Table: ${place}\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
