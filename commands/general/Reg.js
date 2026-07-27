const User = require("../../models/User");

moon({
  name: "register",
  aliases: ["reg"],
  category: "general",
  description: "Register your Moonlight Haven account.",

  async execute(sock, jid, sender, args, m, { reply, findOrCreateWhatsApp, pushName }) {
    try {
      const existing = await User.findOne({ userId: sender });

      if (existing) {
        return reply("✅ You're already registered.");
      }

      await findOrCreateWhatsApp(sender, pushName);

      return reply(
`🌙 *Moonlight Haven Registration*

✅ Your account has been created successfully!

You can now use:
🎰 Gambling commands
💰 Economy commands
🃏 Card commands
🎮 Games

Welcome to Moonlight Haven!`
      );

    } catch (err) {
      console.error(err);
      return reply("❌ Failed to register your account.");
    }
  }
});