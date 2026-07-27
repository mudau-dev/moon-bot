const User = require('../../models/User');
const { money } = require('../gambling/_shared');

moon({
  name: "history",
  category: "economy",
  description: "View your gambling history (daily and weekly summaries)",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
      const user = await User.findOne({ whatsappNumber: target });

      if (!user) return reply("❌ User not found in database.");

      const history = user.history || [];
      if (!history.length) return reply("📭 No gambling history found yet.");

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();

      const daily = history.filter(h => new Date(h.time).getTime() >= startOfDay);
      const weekly = history.filter(h => new Date(h.time).getTime() >= startOfWeek);

      function summarize(items) {
        if (!items.length) return "  No activity recorded.";
        
        // Group by command name
        const grouped = {};
        items.forEach(h => {
          const name = h.type || 'unknown';
          if (!grouped[name]) grouped[name] = { bet: 0, lost: 0, won: 0 };
          
          grouped[name].bet += (h.bet || 0);
          if (h.outcome === 'win') {
            grouped[name].won += (h.amount || 0);
          } else {
            grouped[name].lost += (h.amount || 0);
          }
        });

        let res = "";
        Object.entries(grouped).forEach(([cmd, data]) => {
          res += `*${cmd.toUpperCase()}*\n`;
          res += `  total bet: $${money(data.bet)}\n`;
          res += `  total lost: $${money(data.lost)}\n`;
          res += `  total won: $${money(data.won)}\n\n`;
        });
        return res.trim();
      }

      const tag = `@${target.split('@')[0]}`;
      const report = 
`📜 *GAMBLING HISTORY REPORT* 📜
👤 User: ${tag}

📅 *TODAYS GAMBLE*
━━━━━━━━━━━━━━━
${summarize(daily)}

🗓️ *THIS WEEKS GAMBLE*
━━━━━━━━━━━━━━━
${summarize(weekly)}

> Keep it up, champion! 🎰`;

      return sock.sendMessage(jid, {
        text: report,
        mentions: [target]
      }, { quoted: m });

    } catch (err) {
      console.error("HISTORY ERROR:", err);
      return reply("❌ Failed to fetch history.");
    }
  }
});
