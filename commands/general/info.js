const config = require("../../config");
const User = require("../../models/User");

moon({
  name: "info",
  category: "general",
  description: "Get bot and user information",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const botName = config.BOT_NAME || "Moonlight";
      const userCount = await User.countDocuments();
      
      const text = `🤖 *BOT INFORMATION* 🤖\n\n📛 Name: ${botName}\n👥 Total Users: ${userCount}\n🌐 Status: Online\n\n> Use .help to see all commands.`;
      
      return reply(text);
    } catch (err) {
      console.error("INFO CMD ERROR:", err);
      return reply("❌ Error fetching info.");
    }
  }
});
