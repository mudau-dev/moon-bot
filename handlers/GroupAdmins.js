const { getGroup, updateGroup } = require("../models/athers/GroupSettings");
const { isMuted } = require("../utils/muteStore");
const { checkSuspension } = require("../utils/modTools");

// ─────────────────────────────────────────────
// WARN SYSTEM
// ─────────────────────────────────────────────
function updateWarn(group, userId) {
  if (!group.antilink) group.antilink = {};
  if (!group.antilink.warns) group.antilink.warns = {};

  const current = group.antilink.warns[userId] || 0;
  group.antilink.warns[userId] = current + 1;

  updateGroup(group.groupId || "", group);
  return group.antilink.warns[userId];
}

function resetWarn(group, userId) {
  if (!group.antilink?.warns) return;
  group.antilink.warns[userId] = 0;
  updateGroup(group.groupId || "", group);
}

// ─────────────────────────────────────────────
// LINK DETECTOR
// ─────────────────────────────────────────────
function containsLink(text = "") {
  return /https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/|discord\.gg\//i.test(text);
}

// ─────────────────────────────────────────────
// BUILD MENTION TEXT
// ─────────────────────────────────────────────
function mentionText(jid) {
  return `@${jid.split("@")[0]}`;
}

// ─────────────────────────────────────────────
// SAFE DELETE MESSAGE
// ─────────────────────────────────────────────
async function safeDelete(sock, m) {
  try {
    await sock.sendMessage(m.key.remoteJid, { delete: m.key });
  } catch (e) {
    console.error("[DELETE ERROR]", e.message);
  }
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// Returns true if the handler performed a blocking action (delete/remove/warn),
// otherwise returns false so upstream processing can continue.
module.exports = async function handleGroupAdmins(sock, m) {
  try {
    const jid = m.key.remoteJid;
    if (!jid || !jid.endsWith("@g.us")) return false;

    // Ignore bot's own messages
    if (m.key.fromMe) return false;

    const sender = m.key.participant || m.key.remoteJid;
    if (!sender) return false;

    // ── BAN CHECK (AUTO-REMOVE) ──
    const suspension = await checkSuspension(sender);
    if (suspension.blocked) {
      // Auto-remove banned users from group
      await safeDelete(sock, m);
      try {
        await sock.groupParticipantsUpdate(jid, [sender], "remove");
        await sock.sendMessage(jid, {
          text: `🚫 Banned user ${mentionText(sender)} was detected and removed from the group.`,
          mentions: [sender]
        });
      } catch (e) {
        console.error("[BAN AUTO-REMOVE ERROR]", e.message);
      }
      return true;
    }

    // ── MUTE CHECK (DELETE MESSAGE) ──
    const muted = await isMuted(jid, sender);
    if (muted) {
      await safeDelete(sock, m);
      return true; // Stop further processing
    }

    // Load group settings
    const group = getGroup(jid);
    group.groupId = jid;

    // ── Skip admins/owners from enforcement ──
    let isAdmin = false;
    try {
      const metadata = await sock.groupMetadata(jid);
      const admins = (metadata.participants || [])
        .filter(p => p.admin === "admin" || p.admin === "superadmin")
        .map(a => a.id);
      isAdmin = admins.includes(sender);
    } catch (e) {
      isAdmin = false;
    }

    // If admin: do not run further enforcement
    if (isAdmin) return false;

    // Example: Anti-link enforcement (warn/kick/delete)
    if (group.antilink?.enabled) {
      const text = m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        "";

      if (containsLink(text)) {
        const warnCount = updateWarn(group, sender);
        if (group.antilink.action === 'delete') {
          await safeDelete(sock, m);
          // If action implies removal after limit
          if (group.antilink.warnLimit && warnCount >= group.antilink.warnLimit) {
            try {
              await sock.groupParticipantsUpdate(jid, [sender], "remove");
              await sock.sendMessage(jid, { text: `${mentionText(sender)} removed for repeated links.`, mentions: [sender] });
            } catch (e) {
              console.error("[ANTILINK REMOVE ERROR]", e.message);
            }
            return true;
          }
          return true;
        } else if (group.antilink.action === 'warn') {
          await sock.sendMessage(jid, {
            text: `${mentionText(sender)} Please do not post links in this group. (${warnCount}/${group.antilink.warnLimit})`,
            mentions: [sender]
          });
          return true;
        }
      }
    }

    // No enforcement taken
    return false;

  } catch (err) {
    console.error("[GROUP ADMINS HANDLER ERROR]", err);
    return false;
  }
};
