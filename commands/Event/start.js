const { mentionTag, isGroupAllowed } = require("../../handlers/_shared");
const EventProgress = require("../../models/EventProgress");
const { ROUND_DURATION_MS } = require("./levels");

moon({
  name: "start",
  aliases: [],
  category: "event",
  description: "Start your Moonlight Festival journey",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      // Check if event is enabled in this group
      const allowed = await isGroupAllowed(jid);
      if (!allowed) {
        return reply("🚫 Sorry, you can't use this command here. Use `.egc` to get the event group link.");
      }

      let progress = await EventProgress.findOne({ userId: sender });

      if (progress && progress.started) {
        return reply(
`🌙 You have already started your journey!

Use *.mg* to see your current progress.
Use *.mtime* to see how much time you have left.`
        );
      }

      if (!progress) {
        progress = new EventProgress({ userId: sender });
      }

      progress.started = true;
      progress.currentRound = 1;
      progress.completedRounds = [];
      progress.rewardsClaimed = [];
      progress.skipsUsed = 0;
      progress.cycleCount = 0;
      progress.eventPoints = 0;
      progress.groupId = jid;
      progress.roundStartedAt = new Date();
      progress.roundDeadline = new Date(Date.now() + ROUND_DURATION_MS);
      progress.challengeActive = false;
      progress.challengeLevel = null;

      await progress.save();

      const tag = mentionTag(sender);

      return await sock.sendMessage(jid, {
        image: { url: "https://files.catbox.moe/658sbe.png" },
        caption:
`🌙 ${tag} *Welcome to the Moonlight Festival!*

Your journey has begun. You are on *Level 1*.

⏳ You have *25 hours* to complete each round.
🎯 Use *.mg* to see all 10 challenge levels.
⚔️ Use *.challenge start 1* to begin your first challenge.
⏭ You have *1 skip* available per full cycle.

> Good luck, champion. The Moon is watching. 🌙`,
        mentions: [sender]
      }, { quoted: m });

    } catch (err) {
      console.error("START CMD ERROR:", err);
      return reply("❌ Error starting your journey.");
    }
  }
});
