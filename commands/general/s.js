const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const pino = require('pino');

function unwrapMessage(message) {
  if (!message) return null;
  if (message.ephemeralMessage) return unwrapMessage(message.ephemeralMessage.message);
  if (message.viewOnceMessage) return unwrapMessage(message.viewOnceMessage.message);
  if (message.viewOnceMessageV2) return unwrapMessage(message.viewOnceMessageV2.message);
  if (message.documentWithCaptionMessage) return unwrapMessage(message.documentWithCaptionMessage.message);
  return message;
}

function getContext(m) {
  return m.message?.extendedTextMessage?.contextInfo ||
         m.message?.imageMessage?.contextInfo ||
         m.message?.videoMessage?.contextInfo ||
         m.message?.stickerMessage?.contextInfo ||
         {};
}

function getMediaType(message) {
  if (!message) return null;
  if (message.imageMessage) return 'imageMessage';
  if (message.videoMessage) return 'videoMessage';
  if (message.stickerMessage) return 'stickerMessage';
  return null;
}

moon({
  name: 's',
  aliases: ['sticker', 'stiker'],
  category: 'general',
  description: 'Convert an image, short video, or sticker to a sticker',
  usage: '.s (reply to an image/video/sticker, or caption media with .s)',
  cooldown: 5,
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const ctx = getContext(m);
      const quoted = unwrapMessage(ctx?.quotedMessage);
      const ownMessage = unwrapMessage(m.message);
      
      let messageToDownload;
      let targetMessage;

      if (quoted && getMediaType(quoted)) {
        targetMessage = quoted;
        messageToDownload = {
          message: quoted,
          key: {
            remoteJid: jid,
            id: ctx.stanzaId,
            participant: ctx.participant || ctx.quotedParticipant || sender
          }
        };
      } else if (ownMessage && getMediaType(ownMessage)) {
        targetMessage = ownMessage;
        messageToDownload = m;
      } else {
        return reply('❌ Reply to an image, short video, or sticker to make a sticker.');
      }

      const type = getMediaType(targetMessage);
      const media = targetMessage[type];

      if (type === 'videoMessage' && Number(media?.seconds || 0) > 10) {
        return reply('❌ Video is too long. Please use a video under 10 seconds.');
      }

      const status = await sock.sendMessage(jid, { text: '⏳ Creating sticker...' }, { quoted: m });

      // FIX: Improved download logic
      const buffer = await downloadMediaMessage(
        messageToDownload,
        'buffer',
        {},
        {
          logger: pino({ level: 'silent' }),
          reuploadRequest: sock.updateMediaMessage
        }
      ).catch(err => {
        console.error('DOWNLOAD ERROR:', err);
        return null;
      });

      if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 50) {
        return sock.sendMessage(jid, {
          text: '❌ Failed to download media. Please resend the image/video and try again.',
          edit: status.key
        });
      }

      const sticker = new Sticker(buffer, {
        pack: '𝚳OO𝚴𝐋𝚰𝐆𝚮𝚻',
        author: 'H𝚫V𝚵N',
        type: StickerTypes.FULL,
        categories: ['🤩', '✨'],
        id: 'moonlight-sticker',
        quality: 80
      });

      const stickerBuffer = await sticker.toBuffer();
      await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: m });
      await sock.sendMessage(jid, { text: '✅ Sticker created.', edit: status.key });
    } catch (err) {
      console.error('STICKER CMD ERROR:', err);
      return reply('❌ Failed to create sticker. Make sure the file is an image or a short video under 10 seconds.');
    }
  }
});
