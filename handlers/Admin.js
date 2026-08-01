// handlers/Admin.js
// ─────────────────────────────────────────────────────────────────────────────
// Bot Admin Detection & Group Status (gstatus) Handler
// ─────────────────────────────────────────────────────────────────────────────

const GroupSettings = require('../models/athers/GroupSettings');

/**
 * Check if the bot is an admin in the given group.
 * Uses sock.user.id to determine the bot's JID.
 *
 * @param {object} sock   - Baileys socket
 * @param {string} groupJid - Group JID (ends with @g.us)
 * @returns {Promise<boolean>}
 */
async function isBotAdmin(sock, groupJid) {
  try {
    if (!groupJid || !groupJid.endsWith('@g.us')) return false;

    const botNumber = sock.user?.id ? sock.user.id.split(':')[0] : null;
    if (!botNumber) return false;

    const botJid = botNumber + '@s.whatsapp.net';

    const metadata = await sock.groupMetadata(groupJid);
    const admins = (metadata.participants || [])
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => p.id);

    return admins.includes(botJid);
  } catch (err) {
    console.error('[ADMIN CHECK ERROR]', err.message);
    return false;
  }
}

/**
 * Detect if a message is a status share (forwarded from status@broadcast).
 * Returns true if the message was shared from someone's WhatsApp status.
 */
function isStatusShare(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo
    || msg.message?.imageMessage?.contextInfo
    || msg.message?.videoMessage?.contextInfo
    || msg.message?.stickerMessage?.contextInfo
    || null;

  if (!ctx) return false;

  // WhatsApp marks status-shared messages with remoteJid = 'status@broadcast'
  return ctx.remoteJid === 'status@broadcast';
}

/**
 * Handle gstatus detection in groups.
 * Call this from the messages.upsert handler BEFORE runCommand.
 *
 * @param {object} sock - Baileys socket
 * @param {object} msg  - Raw message object from messages.upsert
 * @returns {Promise<boolean>} - true if the message was handled (stop further processing)
 */
async function handleGstatus(sock, msg) {
  try {
    const jid = msg.key.remoteJid;
    if (!jid || !jid.endsWith('@g.us')) return false;
    if (msg.key.fromMe) return false;

    const sender = msg.key.participant || msg.key.remoteJid;
    if (!sender) return false;

    // Only act if this message is a status share
    if (!isStatusShare(msg)) return false;

    const group = GroupSettings.getGroup(jid);
    const gstatus = group.gstatus;

    // If gstatus detection is off, do nothing
    if (!gstatus?.enabled) return false;

    const senderNumber = sender.split('@')[0];
    const mentionTag = `@${senderNumber}`;

    // Auto-delete the status-share message if configured
    if (gstatus.deleteMsg) {
      try {
        await sock.sendMessage(jid, { delete: msg.key });
      } catch (e) {
        console.error('[GSTATUS DELETE ERROR]', e.message);
      }
    }

    // Warn system
    if (gstatus.warnEnabled) {
      const warns = gstatus.warns || {};
      warns[sender] = (warns[sender] || 0) + 1;
      const warnCount = warns[sender];
      const warnLimit = gstatus.warnLimit || 3;

      // Save updated warns
      GroupSettings.updateGstatus(jid, { warns });

      if (warnCount >= warnLimit) {
        // Reset warn count and kick
        warns[sender] = 0;
        GroupSettings.updateGstatus(jid, { warns });

        try {
          await sock.groupParticipantsUpdate(jid, [sender], 'remove');
        } catch (e) {
          console.error('[GSTATUS KICK ERROR]', e.message);
        }

        await sock.sendMessage(jid, {
          text:
            `🚫 ${mentionTag} has been *removed* from the group.\n` +
            `📋 *Reason:* Sharing status in the group (${warnLimit}/${warnLimit} warnings reached).`,
          mentions: [sender]
        });
      } else {
        await sock.sendMessage(jid, {
          text:
            `⚠️ ${mentionTag} please do not share your *WhatsApp Status* in this group!\n` +
            `> Warning: *${warnCount}/${warnLimit}*`,
          mentions: [sender]
        });
      }
    } else {
      // No warn system, just notify
      await sock.sendMessage(jid, {
        text:
          `⚠️ ${mentionTag} please do not share your *WhatsApp Status* in this group!`,
        mentions: [sender]
      });
    }

    return true; // handled
  } catch (err) {
    console.error('[GSTATUS HANDLER ERROR]', err);
    return false;
  }
}

module.exports = { isBotAdmin, handleGstatus, isStatusShare };
