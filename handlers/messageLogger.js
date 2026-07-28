const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'messages.log');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '', { flag: 'a' });
  }
}

/**
 * Log incoming message to a newline-delimited JSON file for quick inspection.
 * Stores: timestamp, remoteJid, sender, type, text (short), key
 */
async function logMessage(message) {
  try {
    ensureLogDir();

    const msg = message.messages ? message.messages[0] : message; // support both upsert and raw

    const remoteJid = msg?.key?.remoteJid || null;
    const sender = msg?.key?.participant || (msg?.key?.remoteJid || null);

    const body = (
      msg?.message?.conversation ||
      msg?.message?.extendedTextMessage?.text ||
      msg?.message?.imageMessage?.caption ||
      msg?.message?.videoMessage?.caption ||
      ''
    ).toString();

    const short = body.length > 240 ? body.slice(0, 240) + '…' : body;

    const entry = {
      t: new Date().toISOString(),
      remoteJid,
      sender,
      type: msg?.message ? Object.keys(msg.message)[0] : 'unknown',
      text: short,
      key: msg?.key || null
    };

    fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', (err) => {
      if (err) console.error('[MESSAGE LOGGER] Failed to append log:', err.message);
    });
  } catch (err) {
    console.error('[MESSAGE LOGGER ERROR]', err);
  }
}

module.exports = { logMessage };
