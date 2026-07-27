const { mentionTag, formatTime, formatNumber } = require("../../handlers/_shared");
const EventProgress = require("../../models/EventProgress");
const { LEVELS, ROUND_DURATION_MS } = require("./levels");

moon({
  name: "mg",
  aliases: ["moonlight"],
  category: "event",
  description: "Moonlight Festival main game command",
  subcommands: ["lv", "claim", "skip"],

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const sub = (args[0] || "").toLowerCase();

      // ── .mg claim ──
      if (sub === "claim") {
        let progress = await EventProgress.findOne({ userId: sender });

        if (!progress || !progress.started) {
          return reply("❌ You haven't started your journey yet! Use `.start` to begin.");
        }

        if (!progress.challengeActive) {
          return reply("❌ You don't have an active challenge. Use `.challenge start <lv>` first.");
        }

        const round = progress.challengeLevel;
        const level = LEVELS[round - 1];
        const reqs = level.requirements || {};

        // VERIFICATION LOGIC
        const stats = progress.stats || {};
        const startStats = progress.challengeStartStats || {};
        
        const diff = {
          gamblesWon: (stats.gamblesWon || 0) - (startStats.gamblesWon || 0),
          coinsFlipped: (stats.coinsFlipped || 0) - (startStats.coinsFlipped || 0),
          cardsHunted: (stats.cardsHunted || 0) - (startStats.cardsHunted || 0),
          battlesWon: (stats.battlesWon || 0) - (startStats.battlesWon || 0),
          messagesSent: (stats.messagesSent || 0) - (startStats.messagesSent || 0)
        };

        let missing = [];
        if (reqs.gamblesWon && diff.gamblesWon < reqs.gamblesWon) missing.push(`🎰 Win ${reqs.gamblesWon - diff.gamblesWon} more gambles`);
        if (reqs.coinsFlipped && diff.coinsFlipped < reqs.coinsFlipped) missing.push(`🪙 Flip ${reqs.coinsFlipped - diff.coinsFlipped} more coins`);
        if (reqs.cardsHunted && diff.cardsHunted < reqs.cardsHunted) missing.push(`🎴 Hunt ${reqs.cardsHunted - diff.cardsHunted} more cards`);
        if (reqs.battlesWon && diff.battlesWon < reqs.battlesWon) missing.push(`⚔️ Win ${reqs.battlesWon - diff.battlesWon} more battles`);
        if (reqs.messagesSent && diff.messagesSent < reqs.messagesSent) missing.push(`💬 Send ${reqs.messagesSent - diff.messagesSent} more messages`);

        if (missing.length > 0) {
          return reply(`❌ *CHALLENGE NOT COMPLETE* ❌\n\nYou still need to:\n${missing.map(m => `> • ${m}`).join("\n")}`);
        }

        // Process completion
        progress.completedRounds.push(round);
        progress.rewardsClaimed.push(round);
        progress.eventPoints = (progress.eventPoints || 0) + level.points;
        progress.challengeActive = false;
        progress.challengeLevel = null;

        if (round < 10) {
          progress.currentRound = round + 1;
          progress.roundStartedAt = new Date();
          progress.roundDeadline = new Date(Date.now() + ROUND_DURATION_MS);
          await progress.save();

          return await sock.sendMessage(jid, {
            text: `🎉 *LEVEL ${round} COMPLETED!* 🎉\n\nCongratulations ${mentionTag(sender)}!\nYou earned *${level.points}* Event Points.\n\n🎁 *Rewards Claimed:*\n${level.rewards.join("\n")}\n\n🏅 You have advanced to *Level ${progress.currentRound}*.`,
            mentions: [sender]
          }, { quoted: m });
        } else {
          // Finish Cycle
          progress.cycleCount = (progress.cycleCount || 0) + 1;
          progress.currentRound = 1;
          progress.completedRounds = [];
          progress.rewardsClaimed = [];
          progress.skipsUsed = 0;
          progress.roundStartedAt = new Date();
          progress.roundDeadline = new Date(Date.now() + ROUND_DURATION_MS);
          await progress.save();

          return await sock.sendMessage(jid, {
            text: `🏆 *MOONLIGHT CHAMPION!* 🏆\n\n${mentionTag(sender)} has completed all 10 levels!\n🔄 Cycle: *${progress.cycleCount}* complete.`,
            mentions: [sender]
          }, { quoted: m });
        }
      }

      // ── Main Menu (.mg) ──
      let progress = await EventProgress.findOne({ userId: sender });
      if (!progress || !progress.started) {
        return reply("❌ You haven't started your journey yet! Use `.start` to begin.");
      }

      const now = Date.now();
      const deadline = progress.roundDeadline ? new Date(progress.roundDeadline).getTime() : 0;
      const timeLeft = deadline > now ? formatTime(deadline - now) : "EXPIRED";

      let menu = 
`┌─❖
│ 「 🌙 MOONLIGHT CHALLENGE 」
└┬❖
 │ ⏳ Time Left: ${timeLeft}
 │ 🏅 Progress: ${progress.completedRounds.length}/10
 │ 🎁 Rewards: ${progress.challengeActive ? "In Progress..." : "Keep going..."}
 └────────────❖\n\n`;

      LEVELS.forEach((lv, i) => {
        const roundNum = i + 1;
        const isDone = progress.completedRounds.includes(roundNum);
        const isCurrent = progress.currentRound === roundNum;
        
        if (isDone || isCurrent) {
          const statusIcon = isDone ? "✅" : "🟢";
          menu += `${statusIcon} ${roundNum}. ${lv.icon} ${lv.name}\n`;
          if (isCurrent) {
            menu += `> Task:\n${lv.tasks.map(t => `> • ${t}`).join("\n")}\n`;
            menu += `> Reward:\n${lv.rewards.map(r => `> • ${r}`).join("\n")}\n\n`;
          } else {
            menu += `> _Completed!_\n\n`;
          }
        } else {
          menu += `🔒 ${roundNum}. ${lv.icon} ${lv.name}\n`;
          menu += `> 🔒 Complete previous rounds to unlock\n\n`;
        }
      });

      return await sock.sendMessage(jid, {
        text: menu,
        mentions: [sender]
      }, { quoted: m });

    } catch (err) {
      console.error("MG CMD ERROR:", err);
      return reply("❌ Error loading game status.");
    }
  }
});
