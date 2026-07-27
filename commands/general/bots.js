// commands/general/bots.js
// ─────────────────────────────────────────────────────────────────────────────
// Shows real Moonlight Network bot status.
// "Online" = bot process is alive AND WhatsApp is connected (heartbeat < 60s).
// Panel running ≠ bot online — the panel can be "running" while the bot is
// logged out / crashed, so we rely ONLY on the DB heartbeat written by index.js.
// ─────────────────────────────────────────────────────────────────────────────

const Bot    = require('../../models/athers/Bot');
const config = require('../../config');

// ── Real bot names exactly as stored in the DB (config.BOT_NAME per server) ──
const BOT_LIST = [
  { name: 'Rem',     serverId: '5bea48d5' },
  { name: 'Frieren', serverId: '53acc665' },
  { name: 'Elaina',  serverId: '4a86f73d' },
  { name: 'Oreki',   serverId: 'd47d45c4' },
  { name: 'Rimuru',  serverId: '53acc665' },
  { name: 'Cid',     serverId: '934069ee' },
];

// Heartbeat is written every 30 s in index.js → allow a 75 s window so a
// single missed beat doesn't flip the bot to offline.
const HEARTBEAT_WINDOW_MS = 75_000;

moon({
  name: 'bots',
  aliases: ['botstatus', 'botlist'],
  category: 'general',
  description: 'Show the live status of all Moonlight Network bots',
  usage: '.bots',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      // ── Pull every bot record from the shared MongoDB ──────────────────
      const dbBots = await Bot.find({}).lean();
      const now    = Date.now();

      // Build a lookup map keyed by lowercase bot name
      const botMap = new Map();
      for (const doc of dbBots) {
        if (doc?.name) botMap.set(doc.name.toLowerCase(), doc);
      }

      let onlineCount  = 0;
      let offlineCount = 0;
      let rows         = '';

      for (const entry of BOT_LIST) {
        const doc = botMap.get(entry.name.toLowerCase());

        // ── Determine real online/offline state ────────────────────────
        // A bot is ONLINE only when its lastSeen heartbeat is fresh.
        // If the doc is missing or lastSeen is stale the bot is OFFLINE.
        let isOnline = false;
        let lastSeenText = 'never';

        if (doc?.lastSeen) {
          const diff = now - new Date(doc.lastSeen).getTime();
          if (diff >= 0 && diff < HEARTBEAT_WINDOW_MS) {
            isOnline = true;
          }
          // Human-readable "last seen X ago"
          const secs = Math.floor(diff / 1000);
          if (secs < 60)        lastSeenText = `${secs}s ago`;
          else if (secs < 3600) lastSeenText = `${Math.floor(secs / 60)}m ago`;
          else                  lastSeenText = `${Math.floor(secs / 3600)}h ago`;
        }

        const statusEmoji = isOnline ? '🟢' : '🔴';
        const statusText  = isOnline ? 'Online' : 'Offline';
        const modeText    = doc?.staffOnlyMode ? ' ⚙️ Staff Mode' : '';

        if (isOnline) onlineCount++;
        else          offlineCount++;

        rows += `   │ ${statusEmoji} *${entry.name}*  —  ${statusText}${modeText}\n`;
        rows += `   │└ Last seen: \`${lastSeenText}\`\n`;
      }

      const text =
`┌─❖
│ 「 𝙼𝙾𝙾𝙽𝙻𝙸𝙶𝙷𝚃 𝙽𝙴𝚃𝚆𝙾𝚁𝙺 」
└┬❖ 「 𝗕𝗢𝗧 𝗦𝗧𝗔𝗧𝗨𝗦 」
   │
${rows}   │──────────────────────
   │ 🟢 Online : ${onlineCount}  |  🔴 Offline : ${offlineCount}
   │ 🤖 Total  : ${BOT_LIST.length}
   └────────────┈ ⳹`;

      if (config.MOONLIGHT_IMAGE) {
        return sock.sendMessage(
          jid,
          { image: { url: config.MOONLIGHT_IMAGE }, caption: text },
          { quoted: m }
        );
      }
      return reply(text);

    } catch (err) {
      console.error('[BOTS CMD ERROR]', err);
      return reply('❌ Failed to fetch bot status. Please try again.');
    }
  }
});
