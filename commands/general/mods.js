const User = require('../../models/User');
const config = require('../../config');

moon({
  name: 'mods',
  category: 'general',
  description: 'Show Moonlight Haven guardians',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      const staff = await User.find({
        role: { $in: ['Owner', 'True Owner', 'Mod'] }
      });

      if (!staff.length) {
        return reply('❌ No staff members found.');
      }

      const owners = staff.filter(
        u => u.role === 'Owner' || u.role === 'True Owner'
      );

      const mods = staff.filter(
        u => u.role === 'Mod'
      );

      const mentions = [];

      const ownerList = owners.length
        ? owners.map(u => {
            const jidUser =
              u.whatsappNumber ||
              `${u.userId}@s.whatsapp.net`;

            mentions.push(jidUser);

            return `   │ ✦ @${u.userId}`;
          }).join('\n')
        : '   │ ✦ None';

      const modList = mods.length
        ? mods.map(u => {
            const jidUser =
              u.whatsappNumber ||
              `${u.userId}@s.whatsapp.net`;

            mentions.push(jidUser);

            return `   │ ✦ @${u.userId}`;
          }).join('\n')
        : '   │ ✦ None';

      const caption = `┌─❖
│ 「 𝚳OO𝚴𝐋𝚰𝐆𝚮𝚻 」
└┬❖ 「 *SUPPORT* 」
   │────────────┈ ⳹
   │ *「 GUARDIANS 」*
${modList}
   └────────────┈ ⳹
> *INFO:* Since you have asked for help. We will reach you in a short time. Kindly respect the guardians. Your problems will be solved. if you dont understand use the \`.rules\` command`;

      if (config.MENU_IMAGE) {
        return sock.sendMessage(
          jid,
          {
            image: { url: config.MENU_IMAGE },
            caption,
            mentions
          },
          { quoted: m }
        );
      }

      return sock.sendMessage(
        jid,
        {
          text: caption,
          mentions
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('mods error:', err);
      return reply('❌ Failed to load guardians list.');
    }
  }
});