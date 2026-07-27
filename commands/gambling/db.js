const { money, parseBet, validateBet, getUser, win, lose } = require('./_shared');

moon({
  name: 'db',
  aliases: ['deathbattle'],
  category: 'gambling',
  usage: '.db <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 0);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad + '\nUsage: .db <amount|all|half>');
    const hp = Math.floor(Math.random() * 100) + 1;
    const enemy = Math.floor(Math.random() * 100) + 1;
    if (hp >= enemy) {
      const profit = await win(user, bet, 1.2);
      return reply(`⚔️ *Death Battle won!*\n\n👤 Your power: ${hp}\n👹 Enemy power: ${enemy}\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`⚔️ *Death Battle lost!*\n\n👤 Your power: ${hp}\n👹 Enemy power: ${enemy}\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
