const { money, parseBet, validateBet, getUser, win, lose } = require('./_shared');
function card() { return Math.min(10, Math.floor(Math.random() * 13) + 1); }
function hand() { return card() + card() + (Math.random() < 0.35 ? card() : 0); }

moon({
  name: 'blackjack',
  aliases: ['bj'],
  category: 'gambling',
  usage: '.blackjack <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    const user = await getUser(sender, message);
    const bet = parseBet(args, user, 0);
    const bad = validateBet(bet, user);
    if (bad) return reply(bad + '\nUsage: .bj <amount|all|half>');
    const player = hand();
    const dealer = hand();
    const playerBust = player > 21;
    const dealerBust = dealer > 21;
    const isWin = !playerBust && (dealerBust || player > dealer);
    const isPush = !playerBust && !dealerBust && player === dealer;
    if (isPush) return reply(`🃏 *Blackjack push!*\n\n👤 You: ${player}\n🏦 Dealer: ${dealer}\n💰 Wallet: $${money(user.balance)}`);
    if (isWin) {
      const profit = await win(user, bet, player === 21 ? 1.5 : 1);
      return reply(`🃏 *Blackjack won!*\n\n👤 You: ${player}\n🏦 Dealer: ${dealer}\n💵 Profit: $${money(profit)}\n💰 Wallet: $${money(user.balance)}`);
    }
    await lose(user, bet);
    return reply(`🃏 *Blackjack lost!*\n\n👤 You: ${player}\n🏦 Dealer: ${dealer}\n💸 Lost: $${money(bet)}\n💰 Wallet: $${money(user.balance)}`);
  }
});
