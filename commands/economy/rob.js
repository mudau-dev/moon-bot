const { checkCooldown, formatTime } = require('../../utils/cooldown');
const User = require('../../models/User');

function getTarget(message) {
  const ctx = message.message?.extendedTextMessage?.contextInfo;
  return ctx?.mentionedJid?.[0] || ctx?.participant || null;
}

moon({
  name: "rob",
  category: "economy",
  description: "Attempt to rob another user using a pistol",
  usage: ".rob @user",
  cooldown: 3,

  async execute(sock, jid, sender, args, message, { reply }) {
    const ROB_CD = 30 * 60 * 1000;
    const MAX_STEAL = 5000;
    const userId = sender.split('@')[0];

    try {
      const target = getTarget(message);
      if (!target) return reply("❌ Mention or reply to a user.");
      if (target === sender) return reply("❌ You can't rob yourself.");

      const robber = await User.findOne({ userId });
      const targetId = target.split('@')[0];
      const victim = await User.findOne({ userId: targetId });

      if (!victim) return reply("❌ User not found in database.");

      // Check for Pistol
      const hasPistol = robber.inventory ? robber.inventory.some(item => item.name.toLowerCase().includes("pistol")) : false;
      if (!hasPistol) {
        return reply("❌ You need a *Pistol* to rob someone!\n🛒 Buy one at the `.shop` for 790 coins.");
      }

      const { onCooldown, remaining } = checkCooldown(robber.lastRob, ROB_CD);
      if (onCooldown) {
        return reply(`⏳ Wait *${formatTime(remaining)}* before robbing again.`);
      }

      if ((victim.balance || 0) < 100) {
        return reply(`❌ @${targetId} is too broke.`, { mentions: [target] });
      }

      const success = Math.random() < 0.45;
      await User.updateOne({ userId }, { $set: { lastRob: new Date() } });

      if (success) {
        let stolen = Math.floor((victim.balance || 0) * (0.05 + Math.random() * 0.15));
        stolen = Math.min(stolen, MAX_STEAL, victim.balance);

        await User.updateOne({ userId: targetId }, { $inc: { balance: -stolen } });
        await User.updateOne({ userId }, { $inc: { balance: stolen } });

        return reply(`🦹 *Robbery Success*\nYou stole *${stolen.toLocaleString()}* coins from @${targetId}\n💰 Your Balance: ${(robber.balance + stolen).toLocaleString()}`, { mentions: [target] });
      } else {
        let fine = Math.floor((robber.balance || 0) * 0.1);
        fine = Math.min(fine, 3000, robber.balance);

        await User.updateOne({ userId }, { $inc: { balance: -fine } });
        return reply(`🚔 *Robbery Failed*\nYou got caught and lost *${fine.toLocaleString()}* coins.\n💰 Your Balance: ${(robber.balance - fine).toLocaleString()}`);
      }
    } catch (err) {
      console.error("Rob error:", err);
      return reply("❌ Robbery system failed.");
    }
  }
});
