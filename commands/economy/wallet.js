const { money, getUser, preview } = require('./_shared');

moon({
  name: 'balance',
  aliases: ['bal', 'money', 'wallet'],
  category: 'economy',
  description: 'Check your balance.',
  usage: '.bal',
  async execute(sock, jid, sender, args, message, { reply }) {
    try {
      const user = await getUser(sender, message);
      return preview(sock, jid, message, 'Balance', `Wallet $${money(user.balance)}`, `🪙 *Wallet:* $${money(user.balance)}\n🏦 *Bank:* $${money(user.bank)}\n💰 *Total:* $${money(user.balance + user.bank)}`, sender);
    } catch (err) {
      console.error('Balance error:', err);
      return reply('❌ Could not fetch your balance.');
    }
  }
});
