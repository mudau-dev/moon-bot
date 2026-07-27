const { isGroupAllowed, formatNumber } = require("../../handlers/_shared");
const EventProgress = require("../../models/EventProgress");

moon({
  name: "elb",
  aliases: ["eleaderboard"],
  category: "event",
  description: "Show the top members winning in the Moonlight Festival",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      // UNLOCKED: Removed isGroupAllowed check as requested

      // Fetch top 10 by eventPoints, then by cycleCount
      const topPlayers = await EventProgress.find({ started: true })
        .sort({ eventPoints: -1, cycleCount: -1, currentRound: -1 })
        .limit(10);

      if (!topPlayers || topPlayers.length === 0) {
        return reply("📊 No players have started the event yet!\nUse `.start` to begin your journey.");
      }

      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

      let text = `🏆 *MOONLIGHT FESTIVAL LEADERBOARD*\n\n`;

      for (let i = 0; i < topPlayers.length; i++) {
        const p = topPlayers[i];
        const number = p.userId.split("@")[0];
        const tag = `@${number}`;
        const medal = medals[i] || `${i + 1}.`;

        text += `${medal} ${tag}\n`;
        text += `   ⭐ ${formatNumber(p.eventPoints)} pts | 🏅 Lv ${p.currentRound}/10 | 🔄 Cycle ${p.cycleCount || 0}\n\n`;
      }

      text += `\n> Use *.start* to join the event!`;

      const mentions = topPlayers.map(p => p.userId);

      return await sock.sendMessage(jid, {
        text,
        mentions
      }, { quoted: m });

    } catch (err) {
      console.error("ELB CMD ERROR:", err);
      return reply("❌ Error loading leaderboard.");
    }
  }
});
