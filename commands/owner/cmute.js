const { muteUser } = require('../../utils/muteStore');
const { mentionTag } = require('../../handlers/_shared');

moon({
  name: 'cmute',
  category: 'owner',
  roles: ["Mod", "Owner", "True Owner", "CDC"],
  description: 'Owner mute: delete every message sent by a user in this group',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith('@g.us')) return reply('❌ This command only works in groups.');

      let target = args[0];
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }

      if (!target) return reply('❌ Tag, reply, or provide the number of the user to mute.');
      
      const targetJid = target.includes('@') ? target : `${target.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
      
      if (targetJid === sender) return reply("❌ You can't mute yourself.");

      await muteUser(jid, targetJid);
      
      const tag = mentionTag(targetJid);
      return sock.sendMessage(jid, {
        text: `🔇 ${tag} has been muted by staff. Their messages will now be automatically deleted.`,
        mentions: [targetJid]
      }, { quoted: m });

    } catch (err) {
      console.error('CMUTE ERROR:', err);
      return reply('❌ Failed to mute user.');
    }
  }
});
