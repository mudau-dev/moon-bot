const axios = require('axios');
const config = require('../../config');

const AUTH = "Bearer ptlc_3I6J4YUIq6Skyo4XtH5TR6TT3jImV1RHybjHiSGdlIU";
const API_BASE = "https://control.bot-hosting.net/api/client/servers";

const BOT_SERVERS = {
  'rem': '5bea48d5',
  'rimuru': '53acc665',
  'modeus': '4a86f73d',
  'elaina': 'd47d45c4'
};

async function restartServer(serverId) {
  try {
    await axios.post(`${API_BASE}/${serverId}/power`, { signal: 'restart' }, {
      headers: {
        'Authorization': AUTH,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return true;
  } catch (e) {
    console.error(`RESTART ERROR (${serverId}):`, e.message);
    return false;
  }
}

moon({
  name: "restart",
  category: "owner",
  roles: ["True Owner", "CDC"],
  description: "Restart the current bot, all bots, or a specific bot",
  subcommands: ["all", "rem", "rimuru", "modeus", "elaina"],

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const target = (args[0] || "").toLowerCase();

      // ── .restart all ──
      if (target === "all") {
        await reply("🔄 *Restarting all bots in the network...*");
        const results = [];
        for (const [name, id] of Object.entries(BOT_SERVERS)) {
          const ok = await restartServer(id);
          results.push(`${ok ? '✅' : '❌'} ${name.toUpperCase()}`);
        }
        return reply(`🚀 *Restart Sequence Initiated:*\n\n${results.join('\n')}`);
      }

      // ── .restart <bot name> ──
      if (BOT_SERVERS[target]) {
        await reply(`🔄 *Restarting ${target.toUpperCase()}...*`);
        const ok = await restartServer(BOT_SERVERS[target]);
        return reply(ok ? `✅ *${target.toUpperCase()}* is restarting.` : `❌ Failed to restart *${target.toUpperCase()}*.`);
      }

      // ── .restart (current) ──
      const currentBotName = (config.BOT_NAME || "Rem").toLowerCase();
      const currentId = BOT_SERVERS[currentBotName] || BOT_SERVERS['rem'];

      await reply(`🔄 *Restarting current bot (${currentBotName.toUpperCase()})...*`);
      const ok = await restartServer(currentId);
      if (!ok) return reply("❌ Failed to restart current bot via API.");

    } catch (err) {
      console.error("RESTART CMD ERROR:", err);
      return reply("❌ Error executing restart.");
    }
  }
});
