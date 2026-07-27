const User = require('../../models/User');

function getRank(score) {
  if (score >= 1000) return "👑 Legend";
  if (score >= 500) return "🔥 Elite";
  if (score >= 200) return "💎 Advanced";
  if (score >= 100) return "⭐ Active";
  if (score >= 50) return "📈 Rising";
  return "🌱 Beginner";
}

moon({
  name: "rank",
  category: "economy",
  description: "Check user rank and progress",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || sender;

      const user = await User.findOne({ whatsappNumber: target });

      if (!user) {
        return reply("❌ User not found.");
      }

      const balance = user.balance || 0;
      const bank = user.bank || 0;

      const cards = Array.isArray(user.cards) ? user.cards.length : 0;

      // simple activity score (you can later improve this)
      const activityScore =
        Math.floor(balance / 1000) +
        Math.floor(bank / 2000) +
        (cards * 10);

      const rank = getRank(activityScore);

      const text =
`🏅 *USER RANK PROFILE*

👤 User: @${target.split('@')[0]}
━━━━━━━━━━━━━━━

💰 Balance: $${balance}
🏦 Bank: $${bank}
🃏 Cards: ${cards}

📊 Activity Score: ${activityScore}
🏆 Rank: ${rank}

━━━━━━━━━━━━━━━`;

      return sock.sendMessage(jid, {
        text,
        mentions: [target]
      }, { quoted: m });

    } catch (err) {
      console.error("RANK ERROR:", err);
      return reply("❌ Failed to fetch rank.");
    }
  }
});