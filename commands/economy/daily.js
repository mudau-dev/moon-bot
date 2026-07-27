const config = require('../../config');
const User = require('../../models/User');

moon({
  name: "daily",
  category: "economy",
  description: "Claim your daily reward",
  usage: ".daily",
  cooldown: 3,
  aliases: ["clm"],

  async execute(sock, jid, sender, args, message, {
    findOrCreateWhatsApp,
    reply,
    pushName
  }) {
    try {

      const base = await findOrCreateWhatsApp(sender, pushName);
      if (!base) return reply("❌ Database error.");

      const user = await User.findById(base._id);
      if (!user) return reply("❌ User not found.");

      const WORK_CD = 24 * 60 * 60 * 1000;
      const now = new Date();

      const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;

      if (lastDaily && (now - lastDaily) < WORK_CD) {
        const remaining = WORK_CD - (now - lastDaily);
        return reply(`⏳ You already claimed your daily.\nCome back in 24 hours.`);
      }

      const coins = 500;
      const diamonds = 5;

      const updated = await User.findByIdAndUpdate(
        user._id,
        {
          $inc: {
            balance: coins,
            diamonds: diamonds
          },
          $set: {
            lastDaily: now
          }
        },
        { new: true }
      );

      return reply(
`> 🎉 Congrats you have claimed your daily reward!
💰 +${coins} coins
💎 +${diamonds} diamonds
> ⏳ Come back in 24 hours.`
      );

    } catch (err) {
      console.error("Daily error:", err);
      return reply("❌ Failed to claim daily.");
    }
  }
});