const { getGroup } = require('../../models/athers/GroupSettings');
const Group = require('../../models/athers/Group');

moon({
  name: 'gs',
  aliases: ['gstats', 'gcstats'],
  category: 'group',

  async execute(sock, jid, sender, args, m, context) {

    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, {
        text: '❌ This command only works in groups.'
      });
    }

    try {

      const metadata = await sock.groupMetadata(jid);
      const groupSettings = getGroup(jid) || {};
      const dbGroup = await Group.findOne({ groupId: jid }) || {};

      const participants = metadata.participants || [];
      const admins = participants.filter(p => p.admin).length;

      let pfp = null;

      try {
        pfp = await sock.profilePictureUrl(jid, 'image');
      } catch {}

      // SYSTEM STATES
      const gamblingEnabled = dbGroup.gamblingEnabled ?? false;
      const spawnEnabled = dbGroup.spawnEnabled ?? false;
      const cardsEnabled = dbGroup.cardsEnabled ?? false;

      // SAFE SETTINGS
      const antilink = groupSettings.antilink || {};
      const antimention = groupSettings.antimention || {};

      // SHORTEN LONG MSGS
      const welcomeMsg = groupSettings.welcomeMessage
        ? groupSettings.welcomeMessage.slice(0, 100)
        : 'none';

      const leaveMsg = groupSettings.leaveMessage
        ? groupSettings.leaveMessage.slice(0, 100)
        : 'none';

      const text = `┌─❖
│「 𝚳𝚯𝚯𝚴𝐋𝚰𝐆𝚮𝚻 」
└┬❖ 「 📊 𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗦 」
   │ 👥 *Name:* ${metadata.subject}
   │ 👥 *Members:* ${participants.length}
   │ 🛡️ *Admins:* ${admins}
   │
   │ 🔗 *Antilink:* ${antilink.enabled ? 'on' : 'off'}
   │ 🚫 *Action:* ${antilink.action || 'warn'}
   │ ⚠️ *Warns:* ${antilink.warnLimit || 0}
   │
   │ 🕵️ *Anti-mention:* ${antimention.enabled ? 'on' : 'off'}
   │ 🚫 *Action:* ${antimention.action || 'warn'}
   │ ⚠️ *Warns:* ${antimention.warnLimit || 0}
   │
   │ ✉️ *Welcome:* ${groupSettings.welcomeEnabled ? 'on' : 'off'}
   │ 📨 *Msg:* ${welcomeMsg}
   │
   │ 🚪 *Leave:* ${groupSettings.leaveEnabled ? 'on' : 'off'}
   │ 📨 *Msg:* ${leaveMsg}
   │
   ├───────────────
   │ 🎴 *CARDS SYSTEM*
   │ • Status: ${cardsEnabled ? 'on' : 'off'}
   │
   │ 🎲 *CASINO SYSTEM*
   │ • Status: ${gamblingEnabled ? 'on' : 'off'}
   │
   │ 🃏 *SPAWN SYSTEM*
   │ • Status: ${spawnEnabled ? 'on' : 'off'}
   │
   └────────────┈ ⳹`;

      if (pfp) {

        await sock.sendMessage(jid, {
          image: { url: pfp },
          caption: text
        }, { quoted: m });

      } else {

        await sock.sendMessage(jid, {
          text
        }, { quoted: m });

      }

    } catch (err) {

      console.error('GS CMD ERROR:', err);

      await sock.sendMessage(jid, {
        text: '❌ Failed to fetch group stats.'
      }, { quoted: m });

    }
  }
});