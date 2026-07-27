const { money, parseBet, validateBet, getUser, win, lose } = require('./_shared');
const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

moon({
  name: 'roulette',
  aliases: ['r'],
  category: 'gambling',
  usage: '.roulette <red|black|green|odd|even|0-36> <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const choice = String(args[0] || '').toLowerCase();
    const valid = ['red', 'black', 'green', 'odd', 'even'];
    const asNumber = Number(choice);
    const isNumberPick = choice !== '' && Number.isInteger(asNumber) && asNumber >= 0 && asNumber <= 36;
    if (!valid.includes(choice) && !isNumberPick) return reply('❌ Usage: .roulette <red|black|green|odd|even|0-36> <amount|all|half>');
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 1);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad);
    const spin = Math.floor(Math.random() * 37);
    const color = spin === 0 ? 'green' : reds.has(spin) ? 'red' : 'black';
    const isWin = (choice === color) || (choice === 'odd' && spin !== 0 && spin % 2 === 1) || (choice === 'even' && spin !== 0 && spin % 2 === 0) || (isNumberPick && spin === asNumber);
    if (isWin) {
      const multiplier = isNumberPick ? 35 : choice === 'green' ? 14 : 1;
      const profit = await win(user, bet, multiplier);
      return reply(`🎡 *Roulette won!*\n\n🎯 Choice: ${choice}\n🎲 Result: ${spin} (${color})\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`🎡 *Roulette lost!*\n\n🎯 Choice: ${choice}\n🎲 Result: ${spin} (${color})\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
