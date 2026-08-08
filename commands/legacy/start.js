/**
 * commands/legacy/start.js
 * .genesis — Redirects user to the web Legacy start page.
 */
const WEB = process.env.WEB || '';

moon({
  name: 'genesis',
  aliases: ['legacy-start'],
  category: 'legacy',
  description: 'Start your Moonlight Legacy journey on the website.',
  async execute(sock, jid, sender, args, m, { reply }) {
    const link = `${WEB}/lagacy/new`;
    return reply(`⚔️ *MOONLIGHT LEGACY*\n\nCreate your permanent Legacy account and begin your adventure:\n${link}`);
  },
});
