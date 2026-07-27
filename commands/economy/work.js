const { money, getUser, updateUser, preview } = require('./_shared');
const { checkCooldown, formatTime } = require('../../utils/cooldown');

moon({
  name: 'work',
  category: 'economy',
  description: 'Work to earn coins.',
  usage: '.work',
  async execute(sock, jid, sender, args, message, { reply }) {
    try {
      const user = await getUser(sender, message);
      const cooldown = 60 * 60 * 1000;
      const { onCooldown, remaining } = checkCooldown(user.lastWork, cooldown);
      if (onCooldown) return reply(`⏳ You're tired! Come back in *${formatTime(remaining)}*.`);

      const jobs = ['Pizza Delivery Driver', 'Software Developer', 'Graphic Designer', 'Street Performer', 'Chef', 'Dog Walker', 'Taxi Driver', 'Freelancer'];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const earned = Math.floor(Math.random() * 401) + 100;

      const updatedUser = await updateUser(sender, {
        $inc: { balance: earned, totalEarned: earned },
        $set: { lastWork: new Date() }
      });

      return preview(sock, jid, message, 'Work Completed', `Earned $${money(earned)}`, `💼 *Job:* ${job}\n💵 *Earned:* +$${money(earned)}\n🪙 *Wallet:* $${money(updatedUser.balance)}`, sender);
    } catch (err) {
      console.error('Work error:', err);
      return reply('❌ Work failed. Please try again.');
    }
  }
});
