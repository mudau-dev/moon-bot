const { findOrCreateWhatsApp } = require("../database/users");

// ── MENTION HELPERS ───────────────────────────────
function mentionTag(jid) {
  return `@${jid.split("@")[0]}`;
}

function jidToNumber(jid) {
  return jid.split("@")[0];
}

// ── TIME HELPERS ──────────────────────────────────
function formatTime(ms) {
  if (!ms || ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// ── ROLE / PERMISSION HELPERS ──────────────────────
const OWNER_ROLES = ["Owner", "True Owner", "Mod", "CDC"];

async function isOwner(senderJid) {
  try {
    const user = await findOrCreateWhatsApp(senderJid);
    return user && (OWNER_ROLES.includes(user.role) || user.isTrueOwner === true || user.isCDC === true);
  } catch {
    return false;
  }
}

async function getUserRole(senderJid) {
  try {
    const user = await findOrCreateWhatsApp(senderJid);
    return user?.role || "User";
  } catch {
    return "User";
  }
}

// ── GROUP HELPERS ─────────────────────────────────
async function isGroupAllowed(groupJid) {
  try {
    const Group = require("../models/athers/Group");
    const group = await Group.findOne({ groupId: groupJid });
    return group?.eventEnabled === true;
  } catch {
    return false;
  }
}

async function isGamblingGroup(groupJid) {
  try {
    const Group = require("../models/athers/Group");
    const group = await Group.findOne({ groupId: groupJid });
    return group?.gamblingEnabled === true;
  } catch {
    return false;
  }
}

// ── BOT TOGGLE LOGIC ──────────────────────────────
/**
 * Check if the bot should respond to a message.
 * Priority: 
 * 1. Global Staff Mode (Bot model)
 * 2. Group Toggle (GroupSettings)
 */
async function isBotActive(sock, jid, sender) {
  const config = require("../config");
  const Bot = require("../models/athers/Bot");
  const GroupSettings = require("../models/athers/GroupSettings");
  
  const botName = (config.BOT_NAME || "Rem").toLowerCase();
  const botData = await Bot.findOne({ name: botName });
  const isStaff = await isOwner(sender);

  // 1. Global Staff-Only Mode
  if (botData?.staffOnlyMode && !isStaff) return false;

  // 2. Group-Specific Mode
  if (jid.endsWith("@g.us")) {
    const group = GroupSettings.getGroup(jid);
    if (group?.botEnabled === false && !isStaff) return false;
  }

  return true;
}

// ── MESSAGE HELPERS ───────────────────────────────
function getMessageText(m) {
  return (
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    ""
  );
}

async function sendMention(sock, jid, senderJid, text, extra = {}) {
  return sock.sendMessage(jid, {
    text,
    mentions: [senderJid],
    ...extra
  });
}

// ── NUMBER HELPERS ────────────────────────────────
function formatNumber(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ── EXPORTS ───────────────────────────────────────
module.exports = {
  // Mention
  mentionTag,
  jidToNumber,
  // Time
  formatTime,
  formatDate,
  // Role / Permission
  isOwner,
  getUserRole,
  OWNER_ROLES,
  // Group
  isGroupAllowed,
  isGamblingGroup,
  // Bot Toggle
  isBotActive,
  // Message
  getMessageText,
  sendMention,
  // Number
  formatNumber,
  clamp
};
