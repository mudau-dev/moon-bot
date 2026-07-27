moon({
  name: "evt",
  aliases: ["event"],
  category: "event",
  description: "Moonlight Festival event hub — menu, info, rules, support",
  subcommands: ["menu", "info", "rules", "support"],

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const sub = (args[0] || "menu").toLowerCase();

      // ── .evt / .event menu ──
      if (sub === "menu" || sub === "help") {
        return await sock.sendMessage(jid, {
          image: { url: "https://files.catbox.moe/658sbe.png" },
          caption:
`🌙 *MOONLIGHT FESTIVAL — EVENT MENU*

Welcome to the Moonlight Festival event system!

📌 *Event Commands:*
• *.evt info* — full event info
• *.evt rules* — event rules
• *.evt support* — get the event group link

🎮 *Game Commands:*
• *.start* — begin your journey
• *.mg* — see all 10 challenge levels
• *.mg lv <1-10>* — info about a specific level
• *.mg claim* — claim your round reward
• *.mg skip* — skip a round (1 per cycle)
• *.mtime* — time left for your current round
• *.challenge start <lv>* — start a challenge
• *.challenge reset* — reset your active challenge
• *.elb* — top event players leaderboard
• *.egc* — get the event group link`
        }, { quoted: m });
      }

      // ── .evt info ──
      if (sub === "info") {
        return await sock.sendMessage(jid, {
          image: { url: "https://files.catbox.moe/658sbe.png" },
          caption:
`🌙 *MOONLIGHT FESTIVAL 2026 — EVENT INFO*

The Moonlight Festival is a 10-round challenge event where players compete to complete missions, earn rewards, and climb the global leaderboard.

⚔️ *10 Challenge Rounds*
Each round has unique tasks you must complete within *25 hours*.

🎯 *Smart Missions*
Tasks include gambling, battles, card hunting, exploring, and more.

💰 *Rewards*
Coins, Gems, Event Tickets, Crates, Badges, and exclusive titles.

🏆 *Leaderboard*
Top players are ranked by Event Points. Use *.elb* to see the top 10.

👑 *Final Boss — Level 10*
Defeat the Moonlight Boss to claim the Champion title and 100,000 Coins.

🔄 *Infinite Cycles*
After completing all 10 rounds, you can restart and keep earning!

> 🌙 *The Moon is calling. Are you ready?*

Quick commands:
• *.start* — begin your journey
• *.mg* — view all levels
• *.egc* — join the event group`
        }, { quoted: m });
      }

      // ── .evt rules ──
      if (sub === "rules") {
        return reply(
`📜 *MOONLIGHT FESTIVAL — RULES*

1️⃣ Each player has *25 hours* to complete each round.
2️⃣ You can only skip *1 round* per full cycle (10 rounds).
3️⃣ Event commands only work in *allowed event groups*.
4️⃣ No cheating, exploiting, or using bots to complete tasks.
5️⃣ Rewards must be claimed with *.mg claim* before advancing.
6️⃣ The final round (Level 10) cannot be skipped.
7️⃣ After completing all 10 rounds you can restart for more rewards.
8️⃣ The leaderboard is ranked by *Event Points*.
9️⃣ Admins and owners may reset or adjust progress if needed.
🔟 Breaking rules may result in suspension from the event.

> 🌙 Play fair. Stay active. The Moon is watching.`
        );
      }

      // ── .evt support ──
      if (sub === "support") {
        return reply(
`🆘 *MOONLIGHT FESTIVAL — SUPPORT*

Need help with the event? Join the official event support group:

🔗 https://chat.whatsapp.com/HQB6ikDyWqhKKmLDixZqvY?s=cl&p=a&mlu=1&amv=3

> Report bugs, ask questions, or get help from the event team there.`
        );
      }

      return reply(
`📌 *.evt* sub-commands:
• *.evt menu* — event command menu
• *.evt info* — full event info
• *.evt rules* — event rules
• *.evt support* — get the support group link`
      );

    } catch (err) {
      console.error("EVT CMD ERROR:", err);
      return reply("❌ Error loading event info.");
    }
  }
});
