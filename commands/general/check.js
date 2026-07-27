const User = require('../../models/User');
const EventProgress = require('../../models/EventProgress');
const { mentionTag } = require('../../handlers/_shared');

moon({
  name: "check",
  category: "general",
  description: "Check your account for bugs and errors",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const tag = mentionTag(sender);
      
      const msg = await sock.sendMessage(jid, {
        text: `🔍 ${tag} *Loding user account.....*`,
        mentions: [sender]
      }, { quoted: m });

      // Artificial delay for "scanning" effect
      await new Promise(r => setTimeout(r, 1500));
      await sock.sendMessage(jid, {
        text: `🔄 ${tag} *feching account......*`,
        edit: msg.key,
        mentions: [sender]
      });

      await new Promise(r => setTimeout(r, 1500));
      await sock.sendMessage(jid, {
        text: `🛠️ ${tag} *feching erros......*`,
        edit: msg.key,
        mentions: [sender]
      });

      await new Promise(r => setTimeout(r, 1500));

      // Real check
      const user = await User.findOne({ userId: sender.split("@")[0] });
      const event = await EventProgress.findOne({ userId: sender });

      let report = `✅ *ACCOUNT CHECK COMPLETE* ${tag}\n\n`;
      let issues = [];

      if (!user) issues.push("❌ Account not fully initialized in DB.");
      if (user && !user.whatsappNumber) issues.push("⚠️ Missing WhatsApp JID reference.");
      if (user && user.suspended) issues.push(`🚫 Account is currently suspended: ${user.suspendReason || 'No reason'}`);
      
      if (event && event.started) {
        if (!event.roundDeadline) issues.push("⚠️ Event timer is missing.");
        if (event.currentRound > 10) issues.push("⚠️ Round overflow detected.");
      }

      if (issues.length === 0) {
        report += `✨ *Status:* Healthy\n💎 *No bugs or errors found!* Your account is synchronized correctly.`;
      } else {
        report += `⚠️ *Issues Found:* \n${issues.join("\n")}\n\n> Please contact a Mod or Owner to fix these issues.`;
      }

      await sock.sendMessage(jid, {
        text: report,
        edit: msg.key,
        mentions: [sender]
      });

    } catch (err) {
      console.error("CHECK CMD ERROR:", err);
      return reply("❌ Error checking account.");
    }
  }
});
