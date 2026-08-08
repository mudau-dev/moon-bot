const Pokemon = require('../../models/pokemon');
const { getPokemonByIndex } = require('../../utils/pokemonStorage');

moon({
  name: 't2party',
  aliases: ['p2party'],
  category: 'Pokémon',
  description: 'Move a Pokémon from your PC to your active party by PC index.',
  usage: '.t2party <pc_index>',
  async execute(sock, jid, sender, args, m, { reply }) {
    const requestedIndex = Number.parseInt(args[0], 10);
    if (!Number.isInteger(requestedIndex) || requestedIndex < 1) {
      return reply('❌ Usage: `.t2party <pc_index>`\n> Use `.pc` to see your PC indexes.');
    }

    const entry = await getPokemonByIndex(sender, 'pc', requestedIndex);
    if (!entry) {
      return reply('❌ No Pokémon exists at that PC index. Use `.pc` to view your stored Pokémon.');
    }

    const partyCount = await Pokemon.countDocuments({
      userId: { $in: entry.owner.identifiers },
      location: 'party',
    });
    if (partyCount >= 6) {
      return reply('❌ Your party already has six Pokémon. Move one to your PC with `.t2pc <party_index>` first.');
    }

    const moved = await Pokemon.updateOne(
      { _id: entry.pokemon._id, location: 'pc' },
      { $set: { location: 'party' } }
    );

    if (moved.modifiedCount !== 1) {
      return reply('❌ That Pokémon could not be moved. Please refresh your PC and try again.');
    }

    return reply(`✅ *${(entry.pokemon.nickname || entry.pokemon.name).toUpperCase()}* was moved from PC slot ${requestedIndex} to your party.`);
  },
});
