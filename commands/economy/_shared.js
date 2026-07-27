const { findOrCreateWhatsApp, updateUser } = require('../../database/users');
const config = require('../../config');

function money(n) {
  return Math.floor(Number(n) || 0).toLocaleString();
}

function cleanAmount(raw) {
  if (raw === undefined || raw === null) return NaN;
  const str = String(raw).replace(/,/g, '').trim().toLowerCase();
  const suffixes = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
  const match = str.match(/^(\d+(?:\.\d+)?)([kmbt])?$/);
  if (!match) return NaN;
  return Math.floor(Number(match[1]) * (suffixes[match[2]] || 1));
}

async function getUser(sender, message) {
  const pushName = message?.pushName || message?.verifiedBizName || 'User';
  return findOrCreateWhatsApp(sender, pushName);
}

/**
 * PLAIN TEXT MESSAGE SENDER
 * Removed externalAdReply (previews) because non-Business users often can't see them.
 */
async function preview(sock, jid, message, title, body, text, thumbJid) {
  try {
    // Send plain text only for maximum compatibility
    await sock.sendMessage(jid, { text }, { quoted: message });
  } catch (err) {
    console.error('[ECONOMY] Plain text send error:', err);
  }
}

function parseWalletAmount(args, user) {
  const raw = String(args[0] || '').toLowerCase();
  if (raw === 'all' || raw === 'max') return Math.floor(Number(user.balance) || 0);
  if (raw === 'half') return Math.floor((Number(user.balance) || 0) / 2);
  return cleanAmount(raw);
}

function parseBankAmount(args, user) {
  const raw = String(args[0] || '').toLowerCase();
  if (raw === 'all' || raw === 'max') return Math.floor(Number(user.bank) || 0);
  if (raw === 'half') return Math.floor((Number(user.bank) || 0) / 2);
  return cleanAmount(raw);
}

function validAmount(amount) {
  return typeof amount === 'number' && !isNaN(amount) && amount > 0;
}

function getMentionedJid(message, args) {
  const ctx = message?.message?.extendedTextMessage?.contextInfo || message?.message?.imageMessage?.contextInfo || message?.message?.videoMessage?.contextInfo || {};
  const mentioned = ctx.mentionedJid?.[0] || ctx.participant;
  if (mentioned) return mentioned;
  const raw = String(args[0] || '').replace(/[^0-9]/g, '');
  if (raw.length >= 7) return raw + '@s.whatsapp.net';
  return null;
}

module.exports = { money, getUser, updateUser, preview, cleanAmount, parseWalletAmount, parseBankAmount, validAmount, getMentionedJid };
