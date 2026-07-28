const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Downloads media message (image/video/audio/document/sticker) to disk and returns buffer/path
async function downloadMedia(sock, message, options = {}) {
  try {
    const msg = message.message || message;
    const m = msg.imageMessage || msg.videoMessage || msg.audioMessage || msg.documentMessage || msg.stickerMessage || null;
    if (!m) return null;

    // Use baileys helper to download buffer
    const buffer = await downloadMediaMessage({ message: msg }, 'buffer', {}, { logger: require('pino')({ level: 'silent' }) });

    const ext = (m.mimetype || '').split('/').pop() || 'dat';
    const folder = path.join(process.cwd(), 'sessions', 'media');
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const filename = `${Date.now()}_${Math.round(Math.random()*1000)}.${ext}`;
    const filepath = path.join(folder, filename);

    fs.writeFileSync(filepath, buffer);

    return { buffer, path: filepath, mime: m.mimetype || null };
  } catch (err) {
    console.error('[MEDIA HANDLER ERROR]', err.message);
    return null;
  }
}

module.exports = { downloadMedia };