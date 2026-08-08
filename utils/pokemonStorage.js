const Pokemon = require('../models/pokemon');
const { findOrCreateWhatsApp } = require('../database/users');

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function digits(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

async function resolvePokemonOwner(sender) {
  const user = await findOrCreateWhatsApp(sender);
  const identifiers = unique([
    sender,
    digits(sender),
    user?.moonId,
    user?.whatsappNumber,
    user?.userId,
    user?.phoneNumber,
  ]);

  return {
    user,
    identifiers,
    primaryId: user?.moonId || sender,
  };
}

async function ownedPokemonFilter(sender, location) {
  const owner = await resolvePokemonOwner(sender);
  const filter = { userId: { $in: owner.identifiers } };
  if (location) filter.location = location;
  return { owner, filter };
}

async function listPokemon(sender, location, limit) {
  const { owner, filter } = await ownedPokemonFilter(sender, location);
  let query = Pokemon.find(filter).sort({ caughtAt: 1, _id: 1 });
  if (Number.isInteger(limit)) query = query.limit(limit);
  const pokemons = await query;
  return { owner, pokemons };
}

async function getPokemonByIndex(sender, location, oneBasedIndex) {
  const index = Number.parseInt(oneBasedIndex, 10);
  if (!Number.isInteger(index) || index < 1) return null;

  const { owner, pokemons } = await listPokemon(sender, location);
  const pokemon = pokemons[index - 1] || null;
  return pokemon ? { owner, pokemon, index, total: pokemons.length } : null;
}

function getMaxHp(pokemon) {
  const stored = Number(pokemon?.maxHp);
  const current = Number(pokemon?.hp);
  if (Number.isFinite(stored) && stored > 0) return Math.round(stored);
  if (Number.isFinite(current) && current > 0) return Math.round(current);
  return 1;
}

function getCurrentHp(pokemon) {
  const maxHp = getMaxHp(pokemon);
  const current = Number(pokemon?.hp);
  if (!Number.isFinite(current)) return maxHp;
  return Math.max(0, Math.min(Math.round(current), maxHp));
}

function displayName(pokemon) {
  return String(pokemon?.nickname || pokemon?.name || 'Unknown Pokémon').toUpperCase();
}

function formatPokemonDetails(pokemon, options = {}) {
  const maxHp = getMaxHp(pokemon);
  const currentHp = getCurrentHp(pokemon);
  const types = [pokemon?.type1, pokemon?.type2].filter(Boolean).map((type) => String(type).toUpperCase()).join(' / ') || 'UNKNOWN';
  const moves = Array.isArray(pokemon?.moves) && pokemon.moves.length
    ? pokemon.moves.map((move) => String(move).replace(/-/g, ' ').toUpperCase()).join(', ')
    : 'None';
  const title = options.title || `POKÉMON DETAILS: ${displayName(pokemon)}`;

  return [
    `📜 *${title}*`,
    '',
    `*Name:* ${pokemon?.nickname || pokemon?.name || 'Unknown'}`,
    `*ID:* ${pokemon?.pokemonId || 'Unknown'}`,
    `*Capture Rate:* ${pokemon?.captureRate ?? 'Unknown'}`,
    `*Gender:* ${pokemon?.gender || 'Unknown'}`,
    `*Nature:* ${pokemon?.nature || 'Hardy'}`,
    `*Types:* ${types}`,
    `*Level:* ${pokemon?.level ?? 1}`,
    `*XP:* ${pokemon?.xp ?? 0}`,
    `*State:* ${pokemon?.status || 'Healthy'}`,
    `*HP:* ${currentHp}/${maxHp}`,
    `*Attack:* ${pokemon?.attack ?? 0}`,
    `*Defense:* ${pokemon?.defense ?? 0}`,
    `*Sp. Atk:* ${pokemon?.spAtk ?? 0}`,
    `*Sp. Def:* ${pokemon?.spDef ?? 0}`,
    `*Speed:* ${pokemon?.speed ?? 0}`,
    `> *Moves:* ${moves}`,
  ].join('\n');
}

module.exports = {
  resolvePokemonOwner,
  ownedPokemonFilter,
  listPokemon,
  getPokemonByIndex,
  getMaxHp,
  getCurrentHp,
  displayName,
  formatPokemonDetails,
};
