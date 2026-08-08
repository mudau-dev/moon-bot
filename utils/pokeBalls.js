const POKE_BALLS = [
  { id: 'poke-ball', name: 'Poke Ball', aliases: ['pokeball', 'poke ball'], price: 200, emoji: '⚪', description: 'Tries to catch a wild Pokémon.', multiplier: 1 },
  { id: 'great-ball', name: 'Great Ball', aliases: ['greatball', 'great ball'], price: 600, emoji: '🔵', description: 'Tries to catch a wild Pokémon. Success rate is 1.5×.', multiplier: 1.5 },
  { id: 'ultra-ball', name: 'Ultra Ball', aliases: ['ultraball', 'ultra ball'], price: 1200, emoji: '⚫', description: 'Tries to catch a wild Pokémon. Success rate is 2×.', multiplier: 2 },
  { id: 'master-ball', name: 'Master Ball', aliases: ['masterball', 'master ball'], price: 3500, emoji: '🟣', description: 'Catches a wild Pokémon every time.', guaranteed: true },
  { id: 'premier-ball', name: 'Premier Ball', aliases: ['premierball', 'premier ball'], price: 2000, emoji: '⚪', description: 'Tries to catch a wild Pokémon.', multiplier: 1 },
  { id: 'heal-ball', name: 'Heal Ball', aliases: ['healball', 'heal ball'], price: 4000, emoji: '🩷', description: 'Caught Pokémon are immediately healed.', multiplier: 1, healOnCatch: true },
  { id: 'dusk-ball', name: 'Dusk Ball', aliases: ['duskball', 'dusk ball'], price: 6000, emoji: '🌑', description: 'Success rate is 3.5× at night and in caves.', multiplier: 1, nightMultiplier: 3.5 },
  { id: 'net-ball', name: 'Net Ball', aliases: ['netball', 'net ball'], price: 7000, emoji: '🟩', description: 'Success rate is 3× for water and bug Pokémon.', multiplier: 1, waterBugMultiplier: 3 },
  { id: 'luxury-ball', name: 'Luxury Ball', aliases: ['luxuryball', 'luxury ball'], price: 10000, emoji: '🟠', description: 'Caught Pokémon start with 200 happiness.', multiplier: 1, happinessOnCatch: 200 },
  { id: 'quick-ball', name: 'Quick Ball', aliases: ['quickball', 'quick ball'], price: 12000, emoji: '🟡', description: 'Success rate is 4× on the first turn.', multiplier: 1, firstTurnMultiplier: 4 },
  { id: 'beast-ball', name: 'Beast Ball', aliases: ['beastball', 'beast ball'], price: 15000, emoji: '🔶', description: 'Success rate is 5× for Ultra Beasts and 0.1× otherwise.', multiplier: 0.1, ultraBeastMultiplier: 5 },
];

const ULTRA_BEASTS = new Set([
  'nihilego', 'buzzwole', 'pheromosa', 'xurkitree', 'celesteela', 'kartana',
  'guzzlord', 'poipole', 'naganadel', 'stakataka', 'blacephalon',
]);

function normalizeBallName(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function getPokeBall(value) {
  const normalized = normalizeBallName(value);
  return POKE_BALLS.find((ball) => [ball.id, ball.name, ...ball.aliases]
    .some((candidate) => normalizeBallName(candidate) === normalized)) || null;
}

function isNight() {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

function getCatchMultiplier(ball, wildPokemon, turn) {
  if (ball.guaranteed) return Number.POSITIVE_INFINITY;
  if (ball.nightMultiplier && isNight()) return ball.nightMultiplier;
  if (ball.waterBugMultiplier && [wildPokemon.type1, wildPokemon.type2].some((type) => ['water', 'bug'].includes(String(type).toLowerCase()))) {
    return ball.waterBugMultiplier;
  }
  if (ball.firstTurnMultiplier && turn <= 1) return ball.firstTurnMultiplier;
  if (ball.ultraBeastMultiplier && ULTRA_BEASTS.has(String(wildPokemon.name || '').toLowerCase())) return ball.ultraBeastMultiplier;
  return ball.multiplier || 1;
}

function inventoryId(ball) {
  return `pokeball:${ball.id}`;
}

module.exports = {
  POKE_BALLS,
  getPokeBall,
  getCatchMultiplier,
  inventoryId,
};
