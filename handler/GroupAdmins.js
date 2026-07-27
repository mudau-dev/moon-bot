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
// ─────────────────────────────────────────────
module.exports = async function handleGroupAdmins(sock, m) {
  try {
    const jid = m.key.remoteJid;
    if (!jid || !jid.endsWith("@g.us")) return;

    // Ignore bot's own messages
    if (m.key.fromMe) return;

    const sender = m.key.participant || m.key.remoteJid;
    if (!sender) return;

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
      return;
    }

    // ── MUTE CHECK (DELETE MESSAGE) ──
    const muted = await isMuted(jid, sender);
    if (muted) {
      await safeDelete(sock, m);
      return; // Stop further processing
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
        .map(p => p.id);
      isAdmin = admins.includes(sender);
    } catch {}

    if (isAdmin) return;

    // ── Extract message body ──
    const body =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      "";

    // ─────────────────────────────────────────
    // ANTI-LINK
    // ─────────────────────────────────────────
    if (group.antilink?.enabled && containsLink(body)) {
      await safeDelete(sock, m);

      const warn = updateWarn(group, sender);
      const limit = group.antilink.warnLimit || 3;
      const tag = mentionText(sender);

      if (warn >= limit) {
        resetWarn(group, sender);
        try {
          await sock.groupParticipantsUpdate(jid, [sender], "remove");
        } catch {}

        await sock.sendMessage(jid, {
          text: `🚫 ${tag} has been removed for repeatedly sending links.`,
          mentions: [sender]
        });
      } else {
        await sock.sendMessage(jid, {
          text:
`⚠️ ${tag} links are not allowed in this group!
> You have been warned.
*→* ${warn}/${limit} warnings`,
          mentions: [sender]
        });
      }

      return;
    }

    // ─────────────────────────────────────────
    // ANTI-MENTION / STATUS SPAM
    // ─────────────────────────────────────────
    const mentioned =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    const isStatusMention =
      m.message?.extendedTextMessage?.contextInfo?.remoteJid === "status@broadcast";

    if (group.antimention?.enabled && (mentioned.length >= 5 || isStatusMention)) {
      await safeDelete(sock, m);
      const tag = mentionText(sender);
      await sock.sendMessage(jid, {
        text: `🚫 ${tag} mass-mentions and status mentions are not allowed here!`,
        mentions: [sender]
      });
      return;
    }

    // ─────────────────────────────────────────
    // ANTI-BOT
    // ─────────────────────────────────────────
    const isBotLike =
      sender.endsWith("@broadcast") ||
      sender.includes(":") ||
      /bot|spam|auto/i.test(sender.split("@")[0]);

    if (group.antibot?.enabled && isBotLike) {
      await safeDelete(sock, m);
      const warn = updateWarn(group, sender);
      const limit = group.antilink?.warnLimit || 3;
      const tag = mentionText(sender);
      await sock.sendMessage(jid, {
        text: `🤖 ${tag} bot activity detected!\n> You have been warned.\n*→* ${warn}/${limit} warnings`,
        mentions: [sender]
      });
      return;
    }

  } catch (err) {
    console.error("[GROUP ADMINS ERROR]", err);
  }
};
