const Pokemon = require('../models/pokemon');
const { generatePartyImage } = require('./partyGenerator');
const { generatePCImage } = require('./pcGenerator');

/**
 * Pokemon utilities
 * - re-exports image generators
 * - provides DB helpers for party/PC management
 */

/**
 * Get a user's party (max 6, sorted by caughtAt ascending)
 * @param {string} userId - WhatsApp JID of user
 */
async function getParty(userId) {
  return await Pokemon.find({ userId, location: 'party' }).limit(6).sort({ caughtAt: 1 });
}

/**
 * Get a paged view of the user's PC
 * @param {string} userId
 * @param {number} page
 * @param {number} limit
 */
async function getPCPage(userId, page = 1, limit = 30) {
  const skip = Math.max(0, (page - 1) * limit);
  const total = await Pokemon.countDocuments({ userId });
  const pokemons = await Pokemon.find({ userId }).skip(skip).limit(limit).sort({ caughtAt: -1 });
  return { pokemons, page, limit, total };
}

/**
 * Ensure party has at most 6 Pokémon. Any overflow will be moved to PC (location = 'pc').
 * Returns the number of moved Pokémon.
 */
async function ensurePartySlots(userId) {
  const party = await Pokemon.find({ userId, location: 'party' }).sort({ caughtAt: 1 });
  if (party.length <= 6) return 0;
  const toMove = party.slice(6);
  const ops = toMove.map(p => ({ updateOne: { filter: { _id: p._id }, update: { location: 'pc' } } }));
  if (ops.length) {
    await Pokemon.bulkWrite(ops);
  }
  return ops.length;
}

/**
 * Add a Pokémon document into user's collection. If you pass a POJO it will create the doc.
 * If the party has space it will be put into the party, otherwise into the PC.
 * @param {object} pokemonData — full Pokémon object to create (expects fields like userId, name, level...)
 */
async function addPokemon(pokemonData) {
  if (!pokemonData || !pokemonData.userId) throw new Error('pokemonData.userId is required');

  const partyCount = await Pokemon.countDocuments({ userId: pokemonData.userId, location: 'party' });
  const location = partyCount < 6 ? 'party' : 'pc';
  const doc = await Pokemon.create({ ...pokemonData, location });
  return doc;
}

/**
 * Move a specific pokemon to party. If party is full, the oldest party member is moved to PC.
 * @param {string} pokemonId - pokemonId field (not mongo _id)
 */
async function moveToParty(pokemonId) {
  const target = await Pokemon.findOne({ pokemonId });
  if (!target) throw new Error('Pokemon not found');

  if (target.location === 'party') return target; // already in party

  const party = await Pokemon.find({ userId: target.userId, location: 'party' }).sort({ caughtAt: 1 });
  if (party.length < 6) {
    target.location = 'party';
    await target.save();
    return target;
  }

  // party is full, swap: move oldest party to pc and move target to party
  const oldest = party[0];
  oldest.location = 'pc';
  target.location = 'party';
  await Promise.all([oldest.save(), target.save()]);
  return target;
}

/**
 * Move a specific pokemon to PC (location = 'pc')
 * @param {string} pokemonId
 */
async function moveToPC(pokemonId) {
  const target = await Pokemon.findOne({ pokemonId });
  if (!target) throw new Error('Pokemon not found');
  if (target.location === 'pc') return target;
  target.location = 'pc';
  await target.save();
  return target;
}

module.exports = {
  // generators
  generatePartyImage,
  generatePCImage,

  // DB helpers
  getParty,
  getPCPage,
  ensurePartySlots,
  addPokemon,
  moveToParty,
  moveToPC,
};
