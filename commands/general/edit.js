const { sendLinkPreview } = require('../../utils/linkPreview');

const WEB = process.env.WEB || '';

moon({
  name: 'edit',
  aliases: ['profileedit'],
  category: 'general',
  description: 'Open your Moonlight Haven profile and Moon ID editing pages.',
  usage: '.edit',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!WEB) return reply('❌ The website link is not configured yet.');

    const profileLink = `${WEB}/profile/edit`;
    const moonIdLink = `${WEB}/change/id`;
    const text = [
      '📝 *EDIT YOUR MOONLIGHT HAVEN ACCOUNT*',
      '',
      `*Profile:* ${profileLink}`,
      `*Moon ID:* ${moonIdLink}`,
      '',
      '> Open either link to update your account details securely.',
    ].join('\n');

    return sendLinkPreview(sock, jid, m, profileLink, text);
  },
});
