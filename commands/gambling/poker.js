const { money, parseBet, validateBet, getUser, win, lose, pick } = require('./_shared');
const hands = [
  ['High Card', 0, 0.45], ['Pair', 1, 0.28], ['Two Pair', 2, 0.13], ['Three of a Kind', 3, 0.08], ['Flush', 4, 0.04], ['Full House', 6, 0.015], ['Royal Flush', 12, 0.005]
];

moon({
  name: 'poker',
  category: 'gambling',
  usage: '.poker <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 0);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad + '\nUsage: .poker <amount|all|half>');
    let roll = Math.random(), acc = 0, result = hands[0];
    for (const h of hands) { acc += h[2]; if (roll <= acc) { result = h; break; } }
    if (result[1] > 0) {
      const profit = await win(user, bet, result[1]);
      return reply(`♠️ *Poker won!*\n\n🃏 Hand: ${result[0]}\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`♠️ *Poker lost!*\n\n🃏 Hand: ${result[0]}\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
