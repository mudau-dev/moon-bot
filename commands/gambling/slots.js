const { money, parseBet, validateBet, getUser, win, lose } = require('./_shared');
const symbols = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎'];

moon({
  name: 'slots',
  aliases: ['slot'],
  category: 'gambling',
  usage: '.slots <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 0);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad + '\nUsage: .slots <amount|all|half>');
    const row = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
    if (row[0] === row[1] && row[1] === row[2]) {
      const profit = await win(user, bet, 6);
      return reply(`🎰 *SLOTS*\n[ ${row.join(' | ')} ]\n\n🎉 Jackpot!\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    if (row[0] === row[1] || row[1] === row[2] || row[0] === row[2]) {
      const profit = await win(user, bet, 1);
      return reply(`🎰 *SLOTS*\n[ ${row.join(' | ')} ]\n\n✅ Pair win!\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`🎰 *SLOTS*\n[ ${row.join(' | ')} ]\n\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
