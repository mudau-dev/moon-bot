const { money, parseBet, validateBet, getUser, win, lose } = require('./_shared');

moon({
  name: 'coinflip',
  aliases: ['cf'],
  category: 'gambling',
  usage: '.cf <heads|tails> <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const choice = String(args[0] || '').toLowerCase();
    if (!['heads', 'tails', 'h', 't'].includes(choice)) return reply('❌ Usage: .cf <heads|tails> <amount|all|half>');
    const normalized = choice.startsWith('h') ? 'heads' : 'tails';
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 1);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad);
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    if (result === normalized) {
      const profit = await win(user, bet, 1);
      return reply(`🪙 *Coinflip won!*\n\n🎯 You picked: ${normalized}\n🪙 Result: ${result}\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`🪙 *Coinflip lost!*\n\n🎯 You picked: ${normalized}\n🪙 Result: ${result}\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
