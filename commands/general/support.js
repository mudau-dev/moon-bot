const COMMUNITY_LINK = process.env.COMMUNITY_LINK || '';
const DISCORD_LINK = process.env.DISCORD_LINK || '';
const WEB = process.env.WEB || '';

moon({
  name: 'support',
  aliases: ['supportc'],
  category: 'general',
  description: 'Open the official Moonlight Haven support community.',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!COMMUNITY_LINK) return reply('❌ The support community link is not configured yet.');
    return reply(`🆘 *MOONLIGHT HAVEN SUPPORT*\n\n${COMMUNITY_LINK}\n> This is the official support community.`);
  },
});

moon({
  name: 'discord',
  aliases: ['ds'],
  category: 'general',
  description: 'Open the Moonlight Haven Discord server.',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!DISCORD_LINK) return reply('❌ The Discord link is not configured yet.');
    return reply(`💬 *MOONLIGHT HAVEN DISCORD*\n\n${DISCORD_LINK}`);
  },
});

moon({
  name: 'website',
  aliases: ['web'],
  category: 'general',
  description: 'Open the Moonlight Haven website.',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!WEB) return reply('❌ The website link is not configured yet.');
    return reply(`🌙 *MOONLIGHT HAVEN WEBSITE*\n\n${WEB}\n> Create an account, then use \`.webcp <password>\` in the bot to set your website password.`);
  },
});
