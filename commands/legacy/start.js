/**
 * commands/legacy/start.js
 * .genesis — Redirects user to the web Legacy start page.
 */
const config = require('../../config');

moon({
  name: 'genesis',
  aliases: ['legacy-start'],
  category: 'legacy',
  description: 'Start your Moonlight Legacy journey on the website.',
  async execute(sock, jid, sender, args, m, { reply }) {
    const link = `${config.WEB}/lagacy/new`;
    return reply(
      `⚔️ *Moonlight Legacy*\n\n` +
      `Create your permanent Legacy account and begin your adventure on the website:\n\n` +
      `🔗 ${link}`
    );
  },
});
