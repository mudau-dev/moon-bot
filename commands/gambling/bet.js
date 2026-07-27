const { money, parseBet, validateBet, getUser, win, lose } = require('./_shared');

moon({
  name: 'bet',
  category: 'gambling',
  description: 'Simple 50/50 bet.',
  usage: '.bet <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 0);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad + '\nUsage: .bet <amount|all|half>');
    const isWin = Math.random() < 0.48;
    if (isWin) {
      const profit = await win(user, bet, 1);
      return reply(`🎲 *Bet won!*\n\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`🎲 *Bet lost!*\n\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
