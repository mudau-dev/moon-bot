const { listPokemon, getPokemonByIndex, getCurrentHp, getMaxHp, formatPokemonDetails } = require('../../utils/pokemonStorage');
const { fetchPokemonData, fetchPokemonSpecies, rollGender } = require('../../utils/pokemonUtils');

async function enrichDetailMetadata(pokemon) {
  if (pokemon.captureRate != null && pokemon.gender && pokemon.gender !== 'Unknown') return pokemon;

  try {
    const species = await fetchPokemonSpecies(pokemon.name);
    let changed = false;
    if (pokemon.captureRate == null && species.captureRate != null) {
      pokemon.captureRate = species.captureRate;
      changed = true;
    }
    if (!pokemon.gender || pokemon.gender === 'Unknown') {
      pokemon.gender = rollGender(species.genderRate);
      changed = true;
    }
    if (changed) await pokemon.save();
  } catch (error) {
    console.warn('[POKEMON METADATA]', error.message);
  }

  return pokemon;
}

function partyOverview(party, trainerName) {
  const lines = [
    `🌙 *@${trainerName} — CURRENT ACTIVE PARTY*`,
    '━━━━━━━━━━━━━━━━━━━━',
  ];

  for (let index = 0; index < 6; index += 1) {
    const pokemon = party[index];
    if (!pokemon) {
      lines.push(`*${index + 1}.* — Empty slot`);
      continue;
    }

    lines.push(
      `*${index + 1}.* *${(pokemon.nickname || pokemon.name).toUpperCase()}*`,
      `   *HP:* ${getCurrentHp(pokemon)}/${getMaxHp(pokemon)}`,
      `   *GENDER:* ${pokemon.gender || 'Unknown'}`,
      `   *LEVEL:* ${pokemon.level ?? 1}`,
      ''
    );
  }

  lines.push('> Use `.party <index>` to view one Pokémon in full detail.');
  return lines.join('\n');
}

function pcOverview(pokemons, trainerName) {
  const lines = [
    `💻 *@${trainerName} — CURRENT PC*`,
    '━━━━━━━━━━━━━━━━━━━━',
  ];

  if (!pokemons.length) {
    lines.push('Your PC is empty.');
  } else {
    pokemons.forEach((pokemon, index) => {
      lines.push(`${index + 1}. *${(pokemon.nickname || pokemon.name).toUpperCase()}*`);
    });
  }

  lines.push('', '> Use `.pc <index>` to view a Pokémon with its artwork and full details.');
  lines.push('> Use `.t2party <index>` to move it into your active party.');
  return lines.join('\n');
}

moon({
  name: 'party',
  category: 'Pokémon',
  description: 'View your active party or detailed stats for a party slot.',
  usage: '.party [index]',
  async execute(sock, jid, sender, args, m, { reply, pushName }) {
    const selectedIndex = Number.parseInt(args[0], 10);

    if (args[0] && (!Number.isInteger(selectedIndex) || selectedIndex < 1)) {
      return reply('❌ Usage: `.party` or `.party <party_index>`');
    }

    if (selectedIndex) {
      const entry = await getPokemonByIndex(sender, 'party', selectedIndex);
      if (!entry) return reply('❌ No Pokémon exists at that party index.');

      const pokemon = await enrichDetailMetadata(entry.pokemon);
      return reply(formatPokemonDetails(pokemon, { title: `PARTY SLOT ${selectedIndex}: ${(pokemon.nickname || pokemon.name).toUpperCase()}` }));
    }

    const { pokemons } = await listPokemon(sender, 'party', 6);
    if (!pokemons.length) {
      return reply('❌ Your party is empty. Use `.t2party <pc_index>` to add a Pokémon from your PC.');
    }

    await Promise.all(pokemons.map((pokemon) => enrichDetailMetadata(pokemon)));
    return reply(partyOverview(pokemons, pushName || 'Trainer'));
  },
});

moon({
  name: 'pc',
  category: 'Pokémon',
  description: 'View your PC or detailed stats for a stored Pokémon.',
  usage: '.pc [index]',
  async execute(sock, jid, sender, args, m, { reply, pushName }) {
    const selectedIndex = Number.parseInt(args[0], 10);

    if (args[0] && (!Number.isInteger(selectedIndex) || selectedIndex < 1)) {
      return reply('❌ Usage: `.pc` or `.pc <pc_index>`');
    }

    if (selectedIndex) {
      const entry = await getPokemonByIndex(sender, 'pc', selectedIndex);
      if (!entry) return reply('❌ No Pokémon exists at that PC index.');

      const pokemon = await enrichDetailMetadata(entry.pokemon);
      let sprite;
      try {
        sprite = (await fetchPokemonData(pokemon.name)).sprite;
      } catch (error) {
        console.warn('[PC DETAIL SPRITE]', error.message);
      }

      const caption = formatPokemonDetails(pokemon, {
        title: `PC SLOT ${selectedIndex}: ${(pokemon.nickname || pokemon.name).toUpperCase()}`,
      });
      if (sprite) {
        return sock.sendMessage(jid, { image: { url: sprite }, caption }, { quoted: m });
      }
      return reply(caption);
    }

    const { pokemons } = await listPokemon(sender, 'pc');
    return reply(pcOverview(pokemons, pushName || 'Trainer'));
  },
});

moon({
  name: 'pokemon',
  aliases: ['profile', 'trainer'],
  category: 'Pokémon',
  description: 'View a summary of your Pokémon collection.',
  async execute(sock, jid, sender, args, m, { reply, pushName }) {
    const { pokemons } = await listPokemon(sender);
    const party = pokemons.filter((pokemon) => pokemon.location === 'party').slice(0, 6);
    const shinies = pokemons.filter((pokemon) => pokemon.isShiny).length;

    return reply([
      `🌙 *${(pushName || 'Trainer').toUpperCase()} — POKÉMON TRAINER PROFILE*`,
      '━━━━━━━━━━━━━━━━━━━━',
      `*Total Pokémon:* ${pokemons.length}`,
      `*Active Party:* ${party.length}/6`,
      `*Shiny Pokémon:* ${shinies}`,
      '',
      '> Use `.party` to view your active team and `.pc` to view stored Pokémon.',
    ].join('\n'));
  },
});

moon({
  name: 'poke',
  category: 'Pokémon',
  description: 'View a Pokémon you own by its unique ID.',
  usage: '.poke <pokemon_id>',
  async execute(sock, jid, sender, args, m, { reply }) {
    const pokemonId = args[0];
    if (!pokemonId) return reply('❌ Usage: `.poke <pokemon_id>`');

    const { owner, pokemons } = await listPokemon(sender);
    const pokemon = pokemons.find((entry) => entry.pokemonId === pokemonId);
    if (!pokemon) return reply('❌ Pokémon not found in your collection.');

    await enrichDetailMetadata(pokemon);
    let sprite;
    try {
      sprite = (await fetchPokemonData(pokemon.name)).sprite;
    } catch (error) {
      console.warn('[POKE DETAIL SPRITE]', error.message);
    }

    const caption = formatPokemonDetails(pokemon);
    if (sprite) return sock.sendMessage(jid, { image: { url: sprite }, caption }, { quoted: m });
    return reply(caption);
  },
});
