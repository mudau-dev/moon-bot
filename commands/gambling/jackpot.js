const { money, parseBet, validateBet, getUser, win, lose } = require('./_shared');

moon({
  name: 'jackpot',
  aliases: ['jp'],
  category: 'gambling',
  usage: '.jackpot <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 0);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad + '\nUsage: .jackpot <amount|all|half>');
    if (Math.random() < 0.08) {
      const profit = await win(user, bet, 10);
      return reply(`🏆 *JACKPOT!*\n\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`🏆 *Jackpot missed!*\n\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
