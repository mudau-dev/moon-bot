const User = require('../../models/User');
const { isTrueOwner } = require('../../database/users');

moon({
  name: 'rl',
  category: 'owner',
  roles: ["True Owner"],
  description: 'Role management system',
  usage: '.rl list | .rl remove <index>',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!(await isTrueOwner(sender))) {
        return reply("❌ Only True Owner can use this command.");
      }
      
      const users = await User.find({
        role: { $ne: "User" }
      }).sort({ role: 1 });
      
      if (!args[0]) {
        return reply("❌ Usage: .rl list | .rl remove <index>");
      }
      
      const action = args[0].toLowerCase();
      
      if (action === "list") {
        if (users.length === 0) return reply("📭 No users with special roles.");
        let text = "📌 *ROLE LIST*\n\n";
        users.forEach((u, i) => {
          text += `${i + 1}. @${u.userId} — ${u.role}\n`;
        });
        return reply(text, {
          mentions: users.map(u => u.whatsappNumber || u.userId + '@s.whatsapp.net')
        });
      }
      
      if (action === "remove") {
        const index = parseInt(args[1]);
        if (!index || index <= 0 || index > users.length) return reply("❌ Invalid index.");
        const target = users[index - 1];
        target.role = "User";
        target.isCDC = false;
        target.isTrueOwner = false;
        await target.save();
        return reply(`✅ Role removed for @${target.userId}`, {
            mentions: [target.whatsappNumber || target.userId + '@s.whatsapp.net']
        });
      }
      return reply("❌ Unknown option. Use list or remove.");
    } catch (err) {
      console.error("RL ERROR:", err);
      return reply("❌ Role system error.");
    }
  }
});
