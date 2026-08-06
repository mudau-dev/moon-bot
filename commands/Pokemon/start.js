/**
 * commands/Pokemon/start.js
 * .start-journey — Redirects user to the web start-journey page.
 */
const config = require('../../config');

moon({
  name: 'start-journey',
  aliases: ['startjourney', 'journey'],
  category: 'pokémon',
  description: 'Start your Pokémon journey on the Moonlight Haven website.',
  async execute(sock, jid, sender, args, m, { reply }) {
    const link = `${config.WEB}/poke/start-journey`;
    return reply(
      `${link}` +
      `🚀 *Start Your Pokémon Journey!*\n\n` +
      `Visit the link below to choose your starter Pokémon and begin your adventure:\n\n` +
    );
  },
});
