const { unmuteUser } = require('../../utils/muteStore');
const { mentionTag } = require('../../handlers/_shared');

async function isAdmin(sock, jid, userJid) {
  try {
    const meta = await sock.groupMetadata(jid);
    const member = meta.participants.find(p => p.id === userJid || p.jid === userJid);
    return member?.admin === 'admin' || member?.admin === 'superadmin';
  } catch {
    return false;
  }
}

moon({
  name: 'unmute',
  category: 'group',
  description: 'Unmute a group member',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith('@g.us')) return reply('❌ This command only works in groups.');
      if (!(await isAdmin(sock, jid, sender))) return reply('❌ Only group admins can use this command.');

      let target = args[0];
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }

      if (!target) return reply('❌ Tag, reply, or provide the number of the user to unmute.');
      
      const targetJid = target.includes('@') ? target : `${target.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

      await unmuteUser(jid, targetJid);
      
      const tag = mentionTag(targetJid);
      return sock.sendMessage(jid, {
        text: `🔊 ${tag} has been unmuted.`,
        mentions: [targetJid]
      }, { quoted: m });

    } catch (err) {
      console.error('UNMUTE ERROR:', err);
      return reply('❌ Failed to unmute user.');
    }
  }
});
