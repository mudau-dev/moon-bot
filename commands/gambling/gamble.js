const { money, parseBet, validateBet, getUser, win, lose } = require('./_shared');

moon({
  name: 'gamble',
  category: 'gambling',
  usage: '.gamble <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 0);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad + '\nUsage: .gamble <amount|all|half>');
    const roll = Math.random();
    if (roll < 0.12) {
      const profit = await win(user, bet, 3);
      return reply(`🎰 *Big win!*\n\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    if (roll < 0.47) {
      const profit = await win(user, bet, 1);
      return reply(`🎰 *You won!*\n\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`🎰 *You lost!*\n\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
