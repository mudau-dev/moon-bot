/**
 * commands/Pokemon/start.js
 * .start-journey — Redirects user to the web start-journey page.
 */
const WEB = process.env.WEB || '';

moon({
  name: 'start-journey',
  aliases: ['startjourney', 'journey'],
  category: 'pokémon',
  description: 'Start your Pokémon journey on the Moonlight Haven website.',
  async execute(sock, jid, sender, args, m, { reply }) {
    const link = `${WEB}/poke/start-journey`;
    return reply(
      `🚀 *Start Your Pokémon Journey!*\n\n` +
      `Choose your starter Pokémon and begin your adventure:\n${link}`
    );
  },
});
