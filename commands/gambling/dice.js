const { money, parseBet, validateBet, getUser, win, lose } = require('./_shared');

moon({
  name: 'dice',
  category: 'gambling',
  usage: '.dice <1-6> <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const pick = Number(args[0]);
    if (!Number.isInteger(pick) || pick < 1 || pick > 6) return reply('❌ Usage: .dice <1-6> <amount|all|half>');
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 1);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad);
    const roll = Math.floor(Math.random() * 6) + 1;
    if (roll === pick) {
      const profit = await win(user, bet, 5);
      return reply(`🎲 *Dice jackpot!*\n\n🎯 Pick: ${pick}\n🎲 Roll: ${roll}\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`🎲 *Dice lost!*\n\n🎯 Pick: ${pick}\n🎲 Roll: ${roll}\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
