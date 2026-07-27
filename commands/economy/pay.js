const { money, getUser, updateUser, preview, cleanAmount, validAmount, getMentionedJid } = require('./_shared');

moon({
  name: 'pay',
  aliases: ['give'],
  category: 'economy',
  description: 'Pay another user from your wallet.',
  usage: '.pay @user <amount>',
  async execute(sock, jid, sender, args, message, { reply }) {
    try {
      const targetJid = getMentionedJid(message, args);
      const amountArgIndex = targetJid && String(args[0] || '').replace(/[^0-9]/g, '').length >= 7 ? 1 : (targetJid ? 1 : 0);
      const amount = cleanAmount(args[amountArgIndex]);

      if (!targetJid || !validAmount(amount)) return reply('❌ Usage: .pay @user <amount>');
      if (targetJid === sender) return reply('❌ You cannot pay yourself.');

      const payer = await getUser(sender, message);
      if (payer.balance < amount) return reply('❌ You do not have enough coins in your wallet.');

      // Atomically update both users
      const updatedPayer = await updateUser(sender, { $inc: { balance: -amount } });
      await updateUser(targetJid, { $inc: { balance: amount, totalEarned: amount } });

      return preview(sock, jid, message, 'Payment successful!', `$${money(amount)}`, `✅ *Paid:* $${money(amount)}\n👤 *To:* @${targetJid.split('@')[0]}\n🪙 *Wallet:* $${money(updatedPayer.balance)}`, targetJid);
    } catch (err) {
      console.error('Pay error:', err);
      return reply('❌ Payment failed. Please mention a user and try again.');
    }
  }
});
