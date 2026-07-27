const { muteUser } = require('../../utils/muteStore');
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
  name: 'mute',
  category: 'group',
  description: 'Mute a group member (messages will be auto-deleted)',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith('@g.us')) return reply('❌ This command only works in groups.');
      
      // Admin check
      if (!(await isAdmin(sock, jid, sender))) return reply('❌ Only group admins can use this command.');

      let target = args[0];
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }

      if (!target) return reply('❌ Tag, reply, or provide the number of the user to mute.');
      
      const targetJid = target.includes('@') ? target : `${target.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
      
      if (targetJid === sender) return reply("❌ You can't mute yourself.");
      if (await isAdmin(sock, jid, targetJid)) return reply('❌ You cannot mute another group admin.');

      await muteUser(jid, targetJid);
      
      const tag = mentionTag(targetJid);
      return sock.sendMessage(jid, {
        text: `🔇 ${tag} has been muted. Their messages will now be automatically deleted.`,
        mentions: [targetJid]
      }, { quoted: m });

    } catch (err) {
      console.error('MUTE ERROR:', err);
      return reply('❌ Failed to mute user.');
    }
  }
});
