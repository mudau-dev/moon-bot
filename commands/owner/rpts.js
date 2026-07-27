const Report = require('../../models/athers/Report');
const User = require('../../models/User');

moon({
  name: "rpts",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Manage reports",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      
      const sub = (args[0] || '').toLowerCase();

      // =========================
      // LIST REPORTS
      // =========================
      if (sub === "list") {

        const reports = await Report.find().sort({ createdAt: -1 });

        if (!reports.length) {
          return reply("📭 No reports found.");
        }

        let text = `📋 *REPORTS LIST*\nTotal: ${reports.length}\n`;

        const mentions = [];

        reports.slice(0, 30).forEach((r, i) => {
          text += `\n━━━━━━━━━━━━━━━\n`;
          text += `#${i + 1}\n`;
          text += `👤 @${r.userId}\n`;
          text += `📝 ${r.message}\n`;

          mentions.push(r.userId + "@s.whatsapp.net");
        });

        return sock.sendMessage(jid, {
          text,
          mentions
        }, { quoted: m });
      }

      // =========================
      // DELETE REPORT + RESPOND
      // =========================
      if (sub === "del") {

        const index = parseInt(args[1]);
        const ownerMsg = `@${sender.split("@")[0]}`;

        if (!index || !ownerMsg) {
          return reply("❌ Usage:\n.rpts del <number> <message>");
        }

        const reports = await Report.find().sort({ createdAt: -1 });

        const target = reports[index - 1];

        if (!target) {
          return reply("❌ Invalid report number.");
        }

        // ---------------- DM USER ----------------
        try {
          await sock.sendMessage(
            target.userId + "@s.whatsapp.net",
            {
              text:
`📩 REPORT RESPONSE

📝 Report:
${target.message}

💬 Reply:
@${ownerMsg}

━━━━━━━━━━━━━━━`
            }
          );
        } catch (err) {
          console.error("DM failed:", err);
        }

        await Report.deleteOne({ _id: target._id });

        return reply(`✅ Report #${index} handled and removed.`);
      }

      return reply("❌ Usage:\n.rpts list\n.rpts del <number> <message>");

    } catch (err) {
      console.error("Reports cmd error:", err);
      return reply("❌ Failed to manage reports.");
    }
  }
});