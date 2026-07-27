const config = require('../../config');

moon({
  name: 'casinos',
  category: 'general',
  description: 'View Moonlight Haven casino groups',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
        
        const casino1 = config.CASINO_LINK1;
        const casino2 = config.CASINO_LINK2;

      const caption = `┌─『❀』
│ 「 𝚳OO𝚴𝐋𝚰𝐆𝚮𝚻 」
└┬『❀』 「 CASINOS 」
  │────────────┈ ⳹
  │ *『CASINO - I』*
  │ ✦ ${casino1}
  │
  │────────────┈ ⳹
  │ *『CASINO - II』*
  │ ✦ ${casino2}
  │
  ╰────────────┈ ⳹
> The only official casinos in Moonlight haven ✨️.the is no ather group named fore gambling beside this 2
> *TIP:* this are casino not a genenral chat or a RPG group.if where found you where will ban you`;

      if (config.MENU_IMAGE) {
        return sock.sendMessage(
          jid,
          {
            image: { url: config.MENU_IMAGE },
            caption
          },
          { quoted: m }
        );
      }

      return reply(caption);

    } catch (err) {
      console.error('casinos error:', err);
      return reply('❌ Failed to load casino groups.');
    }
  }
});