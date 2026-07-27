// handlers/Bot.js
// ─────────────────────────────────────────────────────────────────────────────
// Force-Add Protection Handler
//
// WhatsApp bots can be force-added to groups by anyone who has the bot's number.
// This handler detects when the bot was added to a group by someone other than
// itself (i.e., force-added rather than joining via invite link or .join cmd),
// then immediately leaves and notifies the person who added it.
//
// HOW IT WORKS:
//   • Listens to the "group-participants.update" event in index.js.
//   • When the bot's own JID appears in the "add" action, it checks whether
//     the bot joined by itself (action triggered by sock.groupAcceptInvite) or
//     was force-added by someone else.
//   • If force-added → leave immediately + send error message to the adder.
//
// INTEGRATION (add to index.js):
//   const { handleForceAdd } = require('./handlers/Bot');
//   sock.ev.on('group-participants.update', async (update) => {
//     await handleForceAdd(sock, update).catch(() => {});
//     handleGroupEvents(sock, update).catch(() => {});
//   });
// ─────────────────────────────────────────────────────────────────────────────

const config = require('../config');

// Track groups the bot intentionally joined (via .join cmd or groupAcceptInvite).
// The join command should call markIntentionalJoin(groupJid) before joining.
const intentionalJoins = new Set();

/**
 * Call this BEFORE sock.groupAcceptInvite(code) so the handler knows
 * the bot is joining on purpose.
 * @param {string} groupJid  — The group JID being joined.
 */
function markIntentionalJoin(groupJid) {
  intentionalJoins.add(groupJid);
  // Auto-clean after 60 seconds in case the join never fires
  setTimeout(() => intentionalJoins.delete(groupJid), 60_000);
}

/**
 * Main handler — call from the "group-participants.update" event listener.
 * @param {object} sock    — Baileys socket instance.
 * @param {object} update  — { id, participants, action, author }
 */
async function handleForceAdd(sock, update) {
  try {
    const { id: groupJid, participants, action, author } = update;

    // We only care about "add" events
    if (action !== 'add') return;

    // Get the bot's own JID (normalise to @s.whatsapp.net)
    const rawBotJid = sock.user?.id || '';
    const botJid    = rawBotJid.includes(':')
      ? rawBotJid.split(':')[0] + '@s.whatsapp.net'
      : rawBotJid;

    // Check if the bot itself is one of the added participants
    const botWasAdded = participants.some(p => {
      const norm = p.includes(':') ? p.split(':')[0] + '@s.whatsapp.net' : p;
      return norm === botJid;
    });

    if (!botWasAdded) return;

    // ── Was this an intentional join? ─────────────────────────────────────
    if (intentionalJoins.has(groupJid)) {
      intentionalJoins.delete(groupJid);
      return; // Bot joined on its own — allow it
    }

    // ── Force-add detected — leave immediately ────────────────────────────
    console.log(`[FORCE-ADD] Bot was force-added to ${groupJid} by ${author || 'unknown'}. Leaving...`);

    // Send a message to the group before leaving so the adder sees why
    const botName = config.BOT_NAME || 'Moonlight';
    const leaveMsg =
      `⛔ *${botName} cannot be added to groups.*\n\n` +
      `This bot can only join groups by itself using an invite link.\n` +
      `If you want ${botName} in your group, please ask an *Owner* or *Mod* to use the *.join <invite link>* command.\n\n` +
      `_You cannot add this bot, but you can invite it._`;

    try {
      await sock.sendMessage(groupJid, { text: leaveMsg });
    } catch (_) {
      // Ignore send failure — still leave
    }

    // Leave the group
    await sock.groupLeave(groupJid);

    // ── Notify the person who added the bot (private DM) ─────────────────
    if (author) {
      const adderJid = author.includes(':')
        ? author.split(':')[0] + '@s.whatsapp.net'
        : author;

      try {
        await sock.sendMessage(adderJid, {
          text:
            `⛔ *You cannot add ${botName} to a group.*\n\n` +
            `${botName} has left the group you added it to.\n\n` +
            `To get ${botName} in your group:\n` +
            `1. Get a group invite link\n` +
            `2. Ask an *Owner* or *Mod* to run *.join <invite link>*\n\n` +
            `_${botName} can only join groups it chooses to join._`
        });
      } catch (_) {
        // DM may fail if the adder has privacy settings — that's fine
      }
    }

  } catch (err) {
    console.error('[FORCE-ADD HANDLER ERROR]', err);
  }
}

module.exports = { handleForceAdd, markIntentionalJoin };
