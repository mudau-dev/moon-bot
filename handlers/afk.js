const User = require('../models/User');

/**
 * AFK Handler — used from multiple call sites with different argument orders.
 * This implementation normalizes the arguments and then runs the AFK logic.
 *
 * Supported call signatures (examples found in repo):
 *   handleAFK(sock, m, sender, jid)
 *   handleAFK(sock, jid, sender, m)
 *   handleAFK(sock, msg, sender, jid, user)  // extra 'user' arg is ignored here
 */
module.exports = async function handleAFK(...args) {
  try {
    // Normalize arguments by type detection
    let sock = null;
    let m = null;
    let sender = null;
    let jid = null;

    // naive classifier helpers
    const looksLikeSock = (x) => x && typeof x === 'object' && typeof x.sendMessage === 'function';
    const looksLikeMessage = (x) => x && typeof x === 'object' && (x.message || x.key);
    const looksLikeJid = (x) => typeof x === 'string' && (x.endsWith('@g.us') || x.endsWith('@s.whatsapp.net') || /^\d+@/i.test(x));
    const looksLikeSender = looksLikeJid;

    for (const a of args) {
      if (!sock && looksLikeSock(a)) sock = a;
      else if (!m && looksLikeMessage(a)) m = a;
      else if (!sender && looksLikeSender(a)) sender = a;
      else if (!jid && typeof a === 'string' && (a.includes('@') || a.endsWith('.g.us') || a.endsWith('@g.us'))) jid = a;
    }

    // Fallback mapping for common alternate orders
    // If we see two strings, prefer one that looks like a group JID for jid
    if (!jid) {
      for (const a of args) {
        if (typeof a === 'string' && a.includes('@')) {
          if (!sender) sender = a;
          else if (!jid) jid = a;
        }
      }
    }

    // Last-resort assignments
    if (!sock && args[0]) sock = args[0];
    if (!m && args[1] && looksLikeMessage(args[1])) m = args[1];

    if (!sender || !jid || !m || !sock) {
      // Not enough data to run AFK logic — fail silently
      return false;
    }

    // ── 1. Check if the sender themselves is AFK ──────────────────────────
    const senderUser = await User.findOne({ whatsappNumber: sender });

    if (senderUser && senderUser.afk === true) {
      const afkSince = senderUser.afkSince ? new Date(senderUser.afkSince).getTime() : Date.now();
      const elapsed  = Date.now() - afkSince;

      const days    = Math.floor(elapsed / 86400000);
      const hours   = Math.floor((elapsed % 86400000) / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      let duration = "";
      if (days > 0)    duration += `${days}d `;
      if (hours > 0)   duration += `${hours}h `;
      if (minutes > 0) duration += `${minutes}m `;
      duration += `${seconds}s`;

      const reason = senderUser.afkReason || "No reason provided";

      // Clear AFK
      senderUser.afk       = false;
      senderUser.afkReason = null;
      senderUser.afkSince  = null;
      await senderUser.save();

      await sock.sendMessage(jid, {
        text:
`👋 *Welcome back, @${sender.split('@')[0]}!*

⏱️ *You were AFK for:* ${duration.trim()}
📌 *Reason was:* ${reason}`,
        mentions: [sender]
      }, { quoted: m });

      // We handled something — return true so callers can stop further processing if desired
      return true;
    }

    // ── 2. Check if any mentioned user is AFK ────────────────────────────
    const mentioned =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
      m.message?.imageMessage?.contextInfo?.mentionedJid ||
      m.message?.videoMessage?.contextInfo?.mentionedJid ||
      [];

    if (!mentioned || !mentioned.length) return false;

    for (const userId of mentioned) {
      if (userId === sender) continue; // skip self-mentions

      const afkUser = await User.findOne({ whatsappNumber: userId });
      if (!afkUser || !afkUser.afk) continue;

      const afkSince = afkUser.afkSince ? new Date(afkUser.afkSince).getTime() : Date.now();
      const elapsed  = Date.now() - afkSince;

      const days    = Math.floor(elapsed / 86400000);
      const hours   = Math.floor((elapsed % 86400000) / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      let duration = "";
      if (days > 0)    duration += `${days}d `;
      if (hours > 0)   duration += `${hours}h `;
      if (minutes > 0) duration += `${minutes}m `;
      duration += `${seconds}s`;

      const reason = afkUser.afkReason || "No reason provided";

      await sock.sendMessage(jid, {
        text:
`🌙 *@${userId.split('@')[0]} is currently AFK*

📝 *Reason:* ${reason}
⏰ *AFK for:* ${duration.trim()}`,
        mentions: [userId]
      }, { quoted: m });
    }

    return true;

  } catch (err) {
    console.error("[AFK HANDLER ERROR]", err);
    return false;
  }
};
