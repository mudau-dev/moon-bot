const config = require('../../config');

moon({
  name: 'support',
  aliases: ['supportc'],
  category: 'general',
  description: 'Replies with our pffical support community.',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
        const community = config.COMMUNITY_LINK;
        
      return reply(`${community}
> this is our only offical support community\nif you want to join our discord server use \`.ds or discord\``);
    } catch (err) {
      console.error(err);
      return reply('❌ An error occurred.');
    }
  }
});

moon({
  name: 'discord',
  aliases: ['ds'],
  category: 'general',
  description: 'Replies with hy.',
    
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
        const discord = config.DISCORD_LINK;
      return reply(`${discord}
> join our discord server fore more fun and fast support`);
    } catch (err) {
      console.error(err);
      return reply('❌ An error occurred.');
    }
  }
});

moon({
  name: 'website',
  aliases: ['web'],
  category: 'general',
  description: 'Replies with hy.',
    
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
        const discord = config.WEB;
      return reply(`${discord}
> here is our community/bot website
if you dont have a account regester one using
\`.webp/regester\` and \`.webcp\` to set you pasword`);
    } catch (err) {
      console.error(err);
      return reply('❌ An error occurred.');
    }
  }
});