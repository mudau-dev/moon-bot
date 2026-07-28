const fs = require('fs');
const path = require('path');
const config = require('../config');

// Error logger that reports uncaught exceptions and unhandled rejections
// and optionally notifies the bot owner via DM when the socket is available.

let sockRef = null;
let ownerJid = process.env.OWNER_JID || config.OWNER_JID || null;

function setSocket(sock) {
  sockRef = sock;
}

async function notifyOwner(text) {
  try {
    if (!sockRef) return;
    if (!ownerJid) return;
    await sockRef.sendMessage(ownerJid, { text });
  } catch (err) {
    // ignore notify failure
    console.error('[ERROR LOGGER] Failed to notify owner:', err.message);
  }
}

function formatErr(err) {
  const name = err && err.name ? err.name : 'Error';
  const message = err && err.message ? err.message : String(err);
  const stack = err && err.stack ? err.stack : ''; 
  return `*${name}*\n${message}\n\nStack:\n${stack}`;
}

function initErrorHandler(sock) {
  setSocket(sock);

  process.on('uncaughtException', async (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
    try {
      const text = `🚨 *Uncaught Exception*\n\n${formatErr(err)}`;
      await notifyOwner(text);
    } catch (e) {}
    // keep process alive — let developer decide to restart
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
    try {
      const text = `🚨 *Unhandled Rejection*\n\n${typeof reason === 'object' ? JSON.stringify(reason, null, 2) : String(reason)}`;
      await notifyOwner(text);
    } catch (e) {}
  });
}

module.exports = { initErrorHandler, setSocket, notifyOwner };
