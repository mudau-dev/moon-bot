const fs = require('fs');
const { downloadMedia } = require('../../handlers/media');
const { uploadToCatbox } = require('../../utils/uploader');

function getQuotedMediaMessage(message) {
  const quotedMessage = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  return quotedMessage ? { message: quotedMessage } : message;
}

moon({
  name: 'url',
  aliases: ['tourl', 'catbox'],
  category: 'general',
  description: 'Upload a sent or replied image/video to Catbox and return a direct URL.',
  usage: '.url (send with media or reply to media)',
  async execute(sock, jid, sender, args, m, { reply }) {
    const sourceMessage = getQuotedMediaMessage(m);
    const media = await downloadMedia(sock, sourceMessage);
    if (!media) {
      return reply('❌ Send `.url` with an image or video, or reply to an image/video with `.url`.');
    }

    try {
      if (media.buffer.length > 200 * 1024 * 1024) {
        return reply('❌ This file is too large for an anonymous upload. Please use a smaller image or video.');
      }

      const extension = String(media.mime || '').split('/')[1] || 'bin';
      const url = await uploadToCatbox(media.buffer, {
        filename: `moonlight-${Date.now()}.${extension}`,
      });
      return reply(`✅ *UPLOAD COMPLETE*\n\n${url}`);
    } catch (error) {
      console.error('[URL COMMAND]', error.message);
      return reply('❌ Upload failed. Please try again with a supported image or video.');
    } finally {
      if (media.path) fs.promises.unlink(media.path).catch(() => {});
    }
  },
});
