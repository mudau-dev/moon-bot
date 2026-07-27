const { money, getUser, preview } = require('./_shared');
const { checkCooldown, formatTime } = require('../../utils/cooldown');

moon({
  name: 'dig',
  category: 'economy',
  description: 'Dig for coins and treasures.',
  usage: '.dig',
  async execute(sock, jid, sender, args, message, { reply }) {
    try {
      const user = await getUser(sender, message);
      const cooldown = 10 * 60 * 1000;
      const { onCooldown, remaining } = checkCooldown(user.lastDig ? new Date(user.lastDig) : null, cooldown);
      if (onCooldown) return reply(`⏳ Your shovel needs rest. Try again in *${formatTime(remaining)}*.`);
      const finds = [
        ['Old Bone', 50], ['Rusty Coin', 80], ['Silver Ring', 150], ['Gold Nugget', 300], ['Ancient Relic', 600]
      ];
      const found = finds[Math.floor(Math.random() * finds.length)];
      const earned = found[1] + Math.floor(Math.random() * 75);
      user.balance += earned;
      user.totalEarned += earned;
      user.lastDig = new Date();
      await user.save();
      return preview(sock, jid, message, 'Dig successful!', found[0], `⛏️ *Found:* ${found[0]}\n💵 *Value:* +$${money(earned)}\n🪙 *Wallet:* $${money(user.balance)}`, sender);
    } catch (err) {
      console.error('Dig error:', err);
      return reply('❌ Dig failed. Please try again.');
    }
  }
});
