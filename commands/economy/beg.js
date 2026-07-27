const { checkCooldown, formatTime } = require('../../utils/cooldown');

moon({
  name: "beg",
  category: "economy",
  description: "Beg for small random money",
  cooldown: 1, // Base moon cooldown

  async execute(sock, jid, sender, args, m, { findOrCreateWhatsApp, reply, pushName }) {
    try {
      const user = await findOrCreateWhatsApp(sender, pushName);
      if (!user) return reply("❌ Database error.");

      // Custom beg cooldown (60 seconds)
      const { onCooldown, remaining } = checkCooldown(user.lastBeg, 60 * 1000);
      if (onCooldown) {
        return reply(`⏳ Slow down! You can beg again in *${formatTime(remaining)}*.`);
      }

      const reward = Math.floor(Math.random() * 91) + 10; // 10–100
      user.balance = (user.balance || 0) + reward;
      user.lastBeg = new Date();

      await user.save();

      const responses = [
        `🥺 You begged and received $${reward}`,
        `🪙 Someone helped you: +$${reward}`,
        `💸 You got pity money: $${reward}`,
        `🙏 A stranger gave you $${reward}`,
        `✨ Lucky beg: +$${reward}`
      ];

      const text = responses[Math.floor(Math.random() * responses.length)];
      return reply(text);

    } catch (err) {
      console.error("BEG ERROR:", err);
      return reply("❌ Beg failed.");
    }
  }
});
