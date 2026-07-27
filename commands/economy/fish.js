const { money, getUser, preview } = require('./_shared');
const { checkCooldown, formatTime } = require('../../utils/cooldown');

moon({
  name: 'fish',
  category: 'economy',
  description: 'Fish for coins.',
  usage: '.fish',
  async execute(sock, jid, sender, args, message, { reply }) {
    try {
      const user = await getUser(sender, message);
      const cooldown = 10 * 60 * 1000;
      const { onCooldown, remaining } = checkCooldown(user.lastFish ? new Date(user.lastFish) : null, cooldown);
      if (onCooldown) return reply(`⏳ The lake is quiet. Try again in *${formatTime(remaining)}*.`);
      const catches = [
        ['Small Fish', 60], ['Salmon', 120], ['Golden Carp', 250], ['Treasure Chest', 500], ['Legendary Tuna', 750]
      ];
      const caught = catches[Math.floor(Math.random() * catches.length)];
      const earned = caught[1] + Math.floor(Math.random() * 75);
      user.balance += earned;
      user.totalEarned += earned;
      user.lastFish = new Date();
      await user.save();
      return preview(sock, jid, message, 'Fishing successful!', caught[0], `🎣 *Caught:* ${caught[0]}\n💵 *Value:* +$${money(earned)}\n🪙 *Wallet:* $${money(user.balance)}`, sender);
    } catch (err) {
      console.error('Fish error:', err);
      return reply('❌ Fishing failed. Please try again.');
    }
  }
});
