const config = require('../../config');

moon({
  name: 'repo',
  aliases: ['fbot'],
  category: 'general',
  description: 'Replies with hy.',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
        const ReadMore = '\u200e'.repeat(4001);

      return reply(`
*『OUR OFFICEAL BOT REPO』*
welcome to our official bot repo on github.com 
*stars:* \`567\`
*fonks:* \`1.45k\`
if you want you own bot fonk it here ${ReadMore}
bitch what are you looking fore you think all publisher my bot never you are stuck at Moonlight 🫩🫩🫩🥲🪽
`);
    } catch (err) {
      console.error(err);
      return reply('❌ An error occurred.');
    }
  }
});