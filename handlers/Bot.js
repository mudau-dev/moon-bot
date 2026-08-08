// handlers/Bot.js
// ─────────────────────────────────────────────────────────────────────────────
// Bot Utilities & Protection Handlers
// ─────────────────────────────────────────────────────────────────────────────

const config = require('../config');
const { exec } = require('child_process');
const path = require('path');

// Track groups the bot intentionally joined
const intentionalJoins = new Set();

/**
 * Call this BEFORE sock.groupAcceptInvite(code)
 */
function markIntentionalJoin(groupJid) {
  intentionalJoins.add(groupJid);
  setTimeout(() => intentionalJoins.delete(groupJid), 60_000);
}

/**
 * Force-Add Protection Handler
 */
async function handleForceAdd(sock, update) {
  try {
    const { id: groupJid, participants, action, author } = update;
    if (action !== 'add') return;

    const rawBotJid = sock.user?.id || '';
    const botJid    = rawBotJid.includes(':')
      ? rawBotJid.split(':')[0] + '@s.whatsapp.net'
      : rawBotJid;

    const botWasAdded = participants.some(p => {
      const norm = p.includes(':') ? p.split(':')[0] + '@s.whatsapp.net' : p;
      return norm === botJid;
    });

    if (!botWasAdded) return;
    if (intentionalJoins.has(groupJid)) {
      intentionalJoins.delete(groupJid);
      return;
    }

    const botName = config.BOT_NAME || 'Moonlight';
    const leaveMsg =
      `⛔ *${botName} cannot be added to groups.*\n\n` +
      `This bot can only join groups by itself using an invite link.\n` +
      `If you want ${botName} in your group, please ask an *Owner* or *Mod* to use the *.join <invite link>* command.`;

    try { await sock.sendMessage(groupJid, { text: leaveMsg }); } catch (_) {}
    await sock.groupLeave(groupJid);

    if (author) {
      const adderJid = author.includes(':') ? author.split(':')[0] + '@s.whatsapp.net' : author;
      try {
        await sock.sendMessage(adderJid, {
          text: `⛔ *You cannot add ${botName} to a group.*\n\n${botName} has left the group you added it to.`
        });
      } catch (_) {}
    }
  } catch (err) {
    console.error('[FORCE-ADD HANDLER ERROR]', err);
  }
}

/**
 * Automatic Update Handler
 * Periodically checks for new commits and updates if found.
 */
function startAutoUpdate(sock) {
  const rootDir = path.join(__dirname, '../');
  setInterval(() => {
    exec('git fetch origin main && git status --short --branch', { cwd: rootDir }, (fetchErr, stdout) => {
      if (fetchErr) return;
      if (!stdout.includes('behind')) return;

      console.log('[AUTO-UPDATE] New commits detected. Updating…');
      exec('git pull --ff-only origin main', { cwd: rootDir }, (pullErr) => {
        if (!pullErr) {
          console.log('[AUTO-UPDATE] Update successful. Restarting…');
          setTimeout(() => process.exit(0), 5000);
        }
      });
    });
  }, 300000); // Check every 5 minutes
}

module.exports = { handleForceAdd, markIntentionalJoin, startAutoUpdate };
