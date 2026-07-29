const User = require('../../models/User');
const { isOwner } = require('../../database/users');

moon({
  name: "brq",
  category: "owner",
  description: "List all bot requests",
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isOwner(sender))) return reply("❌ This command is only for Owners.");

    try {
      const users = await User.find({ "botRequests.0": { $exists: true } });
      
      let allRequests = [];
      users.forEach(user => {
        user.botRequests.forEach(req => {
          allRequests.push({
            userId: user.userId || user.whatsappNumber?.split('@')[0],
            whatsappNumber: user.whatsappNumber,
            groupLink: req.groupLink,
            reason: req.reason,
            status: req.status || "pending",
            createdAt: req.createdAt
          });
        });
      });

      if (allRequests.length === 0) {
        return reply("📭 No bot requests found.");
      }

      // Sort by date (newest first)
      allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      let text = `📋 *BOT REQUESTS LIST* 📋\n\nTotal: ${allRequests.length}\n`;
      const mentions = [];

      allRequests.forEach((r, i) => {
        text += `\n${i + 1}. 👤 @${r.userId}\n`;
        text += `🔗 Link: ${r.groupLink}\n`;
        text += `📝 Reason: ${r.reason}\n`;
        text += `━━━━━━━━━━━━━━━`;
        if (r.whatsappNumber) mentions.push(r.whatsappNumber);
      });

      return await sock.sendMessage(jid, { text, mentions }, { quoted: m });
    } catch (err) {
      console.error("BRQ ERROR:", err);
      return reply("❌ Error fetching bot requests.");
    }
  }
});
