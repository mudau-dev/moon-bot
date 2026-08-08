const Pokemon = require('../../models/pokemon');
const { getPokemonByIndex } = require('../../utils/pokemonStorage');

moon({
  name: 't2pc',
  category: 'Pokémon',
  description: 'Move a Pokémon from your active party to your PC by party index.',
  usage: '.t2pc <party_index>',
  async execute(sock, jid, sender, args, m, { reply }) {
    const requestedIndex = Number.parseInt(args[0], 10);
    if (!Number.isInteger(requestedIndex) || requestedIndex < 1) {
      return reply('❌ Usage: `.t2pc <party_index>`\n> Use `.party` to see your active party indexes.');
    }

    const entry = await getPokemonByIndex(sender, 'party', requestedIndex);
    if (!entry) {
      return reply('❌ No Pokémon exists at that party index. Use `.party` to view your active party.');
    }

    const moved = await Pokemon.updateOne(
      { _id: entry.pokemon._id, location: 'party' },
      { $set: { location: 'pc' } }
    );

    if (moved.modifiedCount !== 1) {
      return reply('❌ That Pokémon could not be moved. Please refresh your party and try again.');
    }

    return reply(`✅ *${(entry.pokemon.nickname || entry.pokemon.name).toUpperCase()}* was moved from party slot ${requestedIndex} to your PC.`);
  },
});
