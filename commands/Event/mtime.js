const { mentionTag, isGroupAllowed, formatTime } = require("../../handlers/_shared");
const EventProgress = require("../../models/EventProgress");

moon({
  name: "mtime",
  aliases: [],
  category: "event",
  description: "Show how much time is left before your current round ends",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      // UNLOCKED: Removed isGroupAllowed check as requested

      const progress = await EventProgress.findOne({ userId: sender });

      if (!progress || !progress.started) {
        return reply("❌ You haven't started yet. Use `.start` to begin your journey.");
      }

      const now = Date.now();
      const deadline = progress.roundDeadline ? new Date(progress.roundDeadline).getTime() : null;

      if (!deadline) {
        return reply("⚠️ Round timer not set. Try using `.start` again or contact support.");
      }

      const msLeft = deadline - now;

      if (msLeft <= 0) {
        return reply(
`⌛ *Round ${progress.currentRound} has expired!*

You ran out of time for this round.
Use *.mg skip* to skip it (if you still have a skip available),
or contact an admin for assistance.`
        );
      }

      const timeStr = formatTime(msLeft);
      const tag = mentionTag(sender);

      return await sock.sendMessage(jid, {
        text:
`⏳ ${tag} *Round Timer*

🏅 Current Level: *${progress.currentRound}/10*
⏰ Time Remaining: *${timeStr}*
📊 Event Points: *${progress.eventPoints || 0}*
🔄 Cycle: *${(progress.cycleCount || 0) + 1}*`,
        mentions: [sender]
      }, { quoted: m });

    } catch (err) {
      console.error("MTIME CMD ERROR:", err);
      return reply("❌ Error checking round timer.");
    }
  }
});
