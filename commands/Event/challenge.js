const EventProgress = require("../../models/EventProgress");
const { LEVELS } = require("./levels");

moon({
  name: "challenge",
  aliases: [],
  category: "event",
  description: "Start or reset a challenge round so the bot can track your completion",
  subcommands: ["start", "reset"],

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const sub = (args[0] || "").toLowerCase();

      // ── .challenge start <lv> ──
      if (sub === "start") {
        const lvIdx = parseInt(args[1]);
        if (!lvIdx || lvIdx < 1 || lvIdx > 10) {
          return reply("❌ Usage: `.challenge start <1-10>`");
        }

        let progress = await EventProgress.findOne({ userId: sender });
        if (!progress || !progress.started) {
          return reply("❌ You haven't started your journey yet! Use `.start` first.");
        }

        if (lvIdx !== progress.currentRound) {
          return reply(`❌ You are currently on Level ${progress.currentRound}. You cannot start Level ${lvIdx}.`);
        }

        if (progress.challengeActive) {
          return reply(`❌ You already have an active challenge for Level ${progress.challengeLevel}. Use \`.challenge reset\` if you want to restart.`);
        }

        // SNAPSHOT STATS FOR VERIFICATION
        progress.challengeActive = true;
        progress.challengeLevel = lvIdx;
        progress.challengeStartedAt = new Date();
        
        // Ensure stats exist
        if (!progress.stats) progress.stats = { gamblesWon: 0, coinsFlipped: 0, cardsHunted: 0, battlesWon: 0, messagesSent: 0 };
        
        // Capture snapshot
        progress.challengeStartStats = {
          gamblesWon: progress.stats.gamblesWon || 0,
          coinsFlipped: progress.stats.coinsFlipped || 0,
          cardsHunted: progress.stats.cardsHunted || 0,
          battlesWon: progress.stats.battlesWon || 0,
          messagesSent: progress.stats.messagesSent || 0
        };

        progress.markModified("challengeStartStats");
        await progress.save();

        return reply(`⚔️ *CHALLENGE STARTED: LEVEL ${lvIdx}* ⚔️\n\nI am now tracking your progress. Complete the tasks and use \`.mg claim\` to get your rewards!`);
      }

      // ── .challenge reset ──
      if (sub === "reset") {
        let progress = await EventProgress.findOne({ userId: sender });
        if (!progress || !progress.challengeActive) {
          return reply("❌ You don't have an active challenge to reset.");
        }

        progress.challengeActive = false;
        progress.challengeLevel = null;
        await progress.save();

        return reply("🔄 Your active challenge has been reset. You can start it again when ready.");
      }

      return reply("❌ Usage: `.challenge start <lv>` or `.challenge reset`.");

    } catch (err) {
      console.error("CHALLENGE CMD ERROR:", err);
      return reply("❌ Error starting challenge.");
    }
  }
});
