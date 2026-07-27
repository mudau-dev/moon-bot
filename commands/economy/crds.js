const Cooldown = require('../../models/athers/Cooldowns');

moon({
  name: "cds",
  category: "economy",
  description: "View your command cooldowns",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      const data = await Cooldown.findOne({
        userId: sender
      });

      if (!data || !data.commands) {
        return reply("✅ You have no active cooldowns.");
      }

      const now = Date.now();

      const active = [];

      for (const [cmd, c] of data.commands.entries()) {

        // SAFE CHECK
        if (!c) continue;

        if ((c.cooldownUntil || 0) > now) {

          const left = Math.ceil(
            (c.cooldownUntil - now) / 1000
          );

          active.push(
            `┃ ${cmd} → ${left}s`
          );
        }
      }

      if (!active.length) {
        return reply("✅ You have no active cooldowns.");
      }

      return reply(
`⏳ *ACTIVE COOLDOWNS*

${active.join('\n')}`
      );

    } catch (err) {

      console.error("cds error:", err);

      return reply("❌ Failed to fetch cooldowns.");
    }
  }
});