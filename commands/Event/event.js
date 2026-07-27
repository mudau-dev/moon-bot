const moon = global.moon;
const config = require('../../config');

moon({
  name: "event",
  category: "event",
  description: "Moonlight festival event info",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const image = "https://files.catbox.moe/658sbe.png";
      const community = config.FUSTIVAL_LINK;

      const text =
`> 🌙 *MOONLIGHT FESTIVAL 2026* 🌙

🚨 *BIG NEWS IS HERE* 🚨

The Moonlight Festival is coming in just 2 MONTHS.

> This is not a normal update… this is a full-scale event war.

⚔️ *10 Challenge Rounds*
🎯 *Smart missions & hidden tasks*
💰 Coins, gems & rare rewards
🏆 Global leaderboard competition
👑 Final Moonlight Boss fight

Only the most active, skilled, and consistent players will survive all 10 rounds.

*New event systems are being built right now:*
• .challenge system
• .event hub
• .leaderboards
• .missions
• .boss fights

When it starts, there is no easy mode.
No shortcuts.
No mercy.

Stay ready. Stay active.
The Moon is calling.

> 🌙 SEE YOU AT THE FESTIVAL 🌙

*TIP:* join our community and get new updates\n${community}`;

      return await sock.sendMessage(
        jid,
        {
          image: { url: image },
          caption: text
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("EVENT CMD ERROR:", err);
      return reply("❌ Failed to load event info");
    }
  }
});