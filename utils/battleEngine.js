const { getMoveData, calculateDamage } = require('./pokemonUtils');

class Battle {
  constructor(player1, player2, wager = 0) {
    this.id = `battle_${Date.now()}`;
    this.players = [player1, player2];
    this.wager = wager;
    this.turn = 1;
    this.weather = this.getRandomWeather();
    this.status = 'selection';
    this.activePokemon = [null, null];
    this.moves = [null, null];
    this.logs = [];
    this.cooldowns = [new Map(), new Map()];
    this.energy = [100, 100];
    this.hp = [0, 0];
    this.droppedItem = null;
    this.inventory = [null, null];
    this.winnerIndex = null;
    this.finishedReason = null;
  }

  getRandomWeather() {
    const weathers = ['Clear', 'Rain', 'Sunny', 'Snow', 'Sandstorm', 'Fog', 'Storm'];
    return weathers[Math.floor(Math.random() * weathers.length)];
  }

  async start() {
    this.status = 'active';
    this.hp = this.activePokemon.map((pokemon) => {
      const maxHp = Math.max(1, Number(pokemon?.maxHp || pokemon?.hp || 1));
      const currentHp = Number.isFinite(Number(pokemon?.hp)) ? Number(pokemon.hp) : maxHp;
      return Math.max(0, Math.min(maxHp, currentHp));
    });
    this.energy = [100, 100];
    this.logs = [`Battle started in ${this.weather} weather!`];
  }

  checkItemDrop() {
    if (this.droppedItem) return false;
    if (![5, 10, 15, 20].includes(this.turn)) return false;

    const items = [
      { name: 'Health Pack', icon: '💖' },
      { name: 'Poison Gas', icon: '☣️' },
      { name: 'Fire Booster', icon: '🔥' },
      { name: 'Energy Drink', icon: '⚡' },
      { name: 'Shield', icon: '🛡️' },
    ];
    const selected = items[Math.floor(Math.random() * items.length)];
    this.droppedItem = { type: selected.name, icon: selected.icon, droppedAt: Date.now() };
    this.logs.push(`🎁 A ${selected.name} dropped. Use \.m catch\ to pick it up.`);
    return true;
  }

  catchItem(playerIndex) {
    if (!this.droppedItem) return 'No item is available to catch.';
    if (Date.now() - this.droppedItem.droppedAt > 10_000) {
      this.droppedItem = null;
      return 'Too slow—the item disappeared.';
    }
    this.inventory[playerIndex] = this.droppedItem.type;
    const itemName = this.droppedItem.type;
    this.droppedItem = null;
    return `✅ You caught the ${itemName}. Use \.m use\ to use it.`;
  }

  useItem(playerIndex) {
    const item = this.inventory[playerIndex];
    if (!item) return "You don't have an item.";

    const myPokemon = this.activePokemon[playerIndex];
    const opponent = this.activePokemon[1 - playerIndex];
    let effect = '';

    if (item === 'Health Pack') {
      const heal = Math.floor(myPokemon.maxHp * 0.2);
      this.hp[playerIndex] = Math.min(myPokemon.maxHp, this.hp[playerIndex] + heal);
      effect = `💖 Restored ${heal} HP.`;
    } else if (item === 'Poison Gas') {
      const damage = Math.floor(myPokemon.maxHp * 0.2);
      this.hp[playerIndex] = Math.max(1, this.hp[playerIndex] - damage);
      effect = `☣️ Poison Gas backfired for ${damage} damage.`;
    } else if (item === 'Fire Booster') {
      const damage = Math.floor(opponent.maxHp * 0.35);
      this.hp[1 - playerIndex] = Math.max(0, this.hp[1 - playerIndex] - damage);
      effect = `🔥 Fire Booster dealt ${damage} damage.`;
    } else if (item === 'Energy Drink') {
      this.energy[playerIndex] = Math.min(100, this.energy[playerIndex] + 50);
      effect = '⚡ Restored 50 energy.';
    } else if (item === 'Shield') {
      effect = '🛡️ Shield activated for the next display turn.';
    }

    this.inventory[playerIndex] = null;
    return effect;
  }

  finish(winnerIndex, reason, results) {
    this.status = 'finished';
    this.winnerIndex = winnerIndex;
    this.finishedReason = reason;
    const winner = this.activePokemon[winnerIndex];
    results.push(`🏆 ${winner.name} won the battle!`);
    this.logs = results;
  }

  async resolveTurn() {
    if (this.status !== 'active') throw new Error('This battle is not active.');
    if (!this.moves[0] || !this.moves[1]) throw new Error('Both battle moves are required.');

    const rawMoves = await Promise.all([getMoveData(this.moves[0]), getMoveData(this.moves[1])]);
    const moves = rawMoves.map((move) => (move.power > 0 ? move : {
      ...move,
      name: `${move.name} (battle strike)`,
      power: 40,
      damageClass: 'physical',
      energy: Math.max(10, move.energy || 15),
    }));

    let order = [0, 1];
    if (this.activePokemon[1].speed > this.activePokemon[0].speed) order = [1, 0];
    if (this.activePokemon[1].speed === this.activePokemon[0].speed && Math.random() > 0.5) order = [1, 0];

    const results = [];
    for (const index of order) {
      if (this.hp[index] <= 0 || this.hp[1 - index] <= 0) continue;

      const attacker = this.activePokemon[index];
      const defender = this.activePokemon[1 - index];
      const move = moves[index];
      if (this.energy[index] < move.energy) {
        results.push(`${attacker.name} could not use ${move.name}: not enough energy.`);
        continue;
      }

      this.energy[index] -= move.energy;
      const damageResult = calculateDamage(attacker, defender, move);
      const damage = Math.max(1, Number(damageResult.total) || 1);
      this.hp[1 - index] = Math.max(0, this.hp[1 - index] - damage);

      let log = `${attacker.name} used ${move.name} and dealt ${damage} damage!`;
      if (damageResult.effectiveness > 1) log += " It's super effective!";
      if (damageResult.effectiveness < 1 && damageResult.effectiveness > 0) log += " It's not very effective...";
      if (damageResult.effectiveness === 0) log += ' The target resisted it.';
      results.push(log);
    }

    this.energy = this.energy.map((energy) => Math.min(100, energy + 10));
    this.moves = [null, null];

    if (this.hp[0] <= 0 || this.hp[1] <= 0) {
      const winnerIndex = this.hp[0] <= 0 ? 1 : 0;
      this.finish(winnerIndex, 'knockout', results);
      return results;
    }

    this.turn += 1;
    this.checkItemDrop();
    if (this.turn > 25) {
      let winnerIndex;
      if (this.hp[0] === this.hp[1]) winnerIndex = Math.random() < 0.5 ? 0 : 1;
      else winnerIndex = this.hp[0] > this.hp[1] ? 0 : 1;
      results.push('⏳ Turn limit reached. The remaining HP decides the winner.');
      this.finish(winnerIndex, 'turn_limit', results);
      return results;
    }

    this.logs = results;
    return results;
  }
}

const battles = new Map();

module.exports = { Battle, battles };
