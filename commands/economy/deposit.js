const { money, getUser, updateUser, preview, parseWalletAmount, parseBankAmount, validAmount } = require('./_shared');

moon({
  name: 'deposit',
  aliases: ['dep', 'dp'],
  category: 'economy',
  description: 'Deposit wallet coins into the bank.',
  usage: '.dep <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    try {
      const user = await getUser(sender, message);
      const amount = parseWalletAmount(args, user);
      if (!validAmount(amount)) return reply('❌ Usage: .dep <amount|all|half>');
      if (user.balance < amount) return reply('You do not have enough coins in your wallet to deposit that amount.');

      const updatedUser = await updateUser(sender, {
        $inc: { balance: -amount, bank: amount }
      });

      return preview(sock, jid, message, 'Deposit successful!', `$${money(amount)}`, `🏦 *Bank:* $${money(updatedUser.bank)}\n🪙 *Wallet:* $${money(updatedUser.balance)}`, sender);
    } catch (err) {
      console.error('Deposit error:', err);
      return reply('❌ Deposit failed. Please try again.');
    }
  }
});

moon({
  name: 'withdraw',
  aliases: ['wd', 'with'],
  category: 'economy',
  description: 'Withdraw bank coins into the wallet.',
  usage: '.wd <amount|all|half>',
  async execute(sock, jid, sender, args, message, { reply }) {
    try {
      const user = await getUser(sender, message);
      const amount = parseBankAmount(args, user);
      if (!validAmount(amount)) return reply('❌ Usage: .wd <amount|all|half>');
      if (user.bank < amount) return reply('You do not have enough coins in your bank to withdraw that amount.');

      const updatedUser = await updateUser(sender, {
        $inc: { bank: -amount, balance: amount }
      });

      return preview(sock, jid, message, 'Withdrawal successful!', `$${money(amount)}`, `🏦 *Bank:* $${money(updatedUser.bank)}\n🪙 *Wallet:* $${money(updatedUser.balance)}`, sender);
    } catch (err) {
      console.error('Withdraw error:', err);
      return reply('❌ Withdrawal failed. Please try again.');
    }
  }
});
