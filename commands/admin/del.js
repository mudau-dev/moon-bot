const config = require('../../config');

moon({
  name: 'delete',
  aliases: ['del'],
  category: 'group',

  async execute(sock, jid, sender, args, m) {
    try {

      if (!jid.endsWith('@g.us')) return;

      const metadata = await sock.groupMetadata(jid);

      const senderNumber = sender.split('@')[0];
      const isOwner = (config.OWNER_NUMBERS || []).includes(senderNumber);

      const isAdmin = metadata.participants.some(
        p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
      );

      if (!isOwner && !isAdmin) return;

      const bot = metadata.participants.find(p => p.id === config.BOT_JID);
      const isBotAdmin = bot && (bot.admin === 'admin' || bot.admin === 'superadmin');

      const quoted = m.message?.extendedTextMessage?.contextInfo;

      // -------- DELETE TARGET (ONLY IF BOT ADMIN) --------
      if (quoted?.stanzaId && isBotAdmin) {
        try {
          await sock.sendMessage(jid, {
            delete: {
              remoteJid: jid,
              fromMe: false,
              id: quoted.stanzaId,
              participant: quoted.participant
            }
          });
        } catch {}
      }

      // -------- DELETE THE .del COMMAND MESSAGE --------
      try {
        await sock.sendMessage(jid, {
          delete: m.key   // THIS is the correct way
        });
      } catch {}

    } catch (err) {
      console.error('Delete cmd error:', err);
    }
  }
});