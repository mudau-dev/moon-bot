const { findOrCreateWhatsApp } = require('../../database/users');
const { unmuteUser } = require('../../utils/muteStore');

function getContext(m) {
  return m.message?.extendedTextMessage?.contextInfo || {};
}

function resolveTarget(args, m) {
  const ctx = getContext(m);
  const mentioned = ctx?.mentionedJid?.[0];
  if (mentioned) return mentioned;
  if (ctx?.participant) return ctx.participant;
  const number = args[0]?.replace(/[^0-9]/g, '');
  return number ? `${number}@s.whatsapp.net` : null;
}

moon({
  name: 'cunmute',
  category: 'owner',
  roles: ["Mod", "Owner", "True Owner"],
  description: 'Owner unmute: stop deleting a user’s group messages',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith('@g.us')) return reply('❌ This command only works in groups.');

      const owner = await findOrCreateWhatsApp(sender);
      if (!['True Owner', 'Owner', 'Mod'].includes(owner?.role) && owner?.isTrueOwner !== true) {
        return reply("❌ You can't use this command.");
      }

      const target = resolveTarget(args, m);
      if (!target) return reply('❌ Mention/reply to a user or provide a number.\nUsage: .cunmute @user');

      await unmuteUser(jid, target);
      return sock.sendMessage(jid, {
        text: `🔊 @${target.split('@')[0]} has been unmuted.`,
        mentions: [target]
      }, { quoted: m });
    } catch (err) {
      console.error('CUNMUTE ERROR:', err);
      return reply('❌ Failed to unmute user.');
    }
  }
});
