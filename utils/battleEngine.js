const { getMoveData, calculateDamage } = require('./pokemonUtils');

class Battle {
    constructor(player1, player2, wager = 0) {
        this.id = `battle_${Date.now()}`;
        this.players = [player1, player2]; // { jid, name, pokemon: [] }
        this.wager = wager;
        this.turn = 1;
        this.weather = this.getRandomWeather();
        this.status = 'selection'; // selection, active, finished
        this.activePokemon = [null, null];
        this.moves = [null, null]; // Current turn moves
        this.logs = [];
        this.cooldowns = [new Map(), new Map()];
        this.energy = [100, 100];
        this.hp = [0, 0];
        this.droppedItem = null; // { type, droppedAt }
        this.inventory = [null, null]; // Held item for each player
    }

    getRandomWeather() {
        const weathers = ['Clear', 'Rain', 'Sunny', 'Snow', 'Sandstorm', 'Fog', 'Storm'];
        return weathers[Math.floor(Math.random() * weathers.length)];
    }

    async start() {
        this.status = 'active';
        this.hp = [this.activePokemon[0].maxHp, this.activePokemon[1].maxHp];
        this.energy = [100, 100];
        this.logs.push(`Battle started in ${this.weather} weather!`);
    }

    checkItemDrop() {
        if (this.droppedItem) return;
        if (this.turn === 5 || this.turn === 10 || this.turn === 15 || this.turn === 20) {
            const items = [
                { name: 'Health Pack', icon: '💖' },
                { name: 'Poison Gas', icon: '☣️' },
                { name: 'Fire Booster', icon: '🔥' },
                { name: 'Energy Drink', icon: '⚡' },
                { name: 'Shield', icon: '🛡️' }
            ];
            const selected = items[Math.floor(Math.random() * items.length)];
            this.droppedItem = {
                type: selected.name,
                icon: selected.icon,
                droppedAt: Date.now()
            };
            this.logs.push(`🎁 a ${selected.name} has droped use *.m c* to catch it`);
            return true;
        }
        return false;
    }

    catchItem(playerIdx) {
        if (!this.droppedItem) return "No item to catch!";
        const now = Date.now();
        if (now - this.droppedItem.droppedAt > 10000) { // Increased to 10s for better experience
            this.droppedItem = null;
            return "Too slow! The item disappeared.";
        }
        this.inventory[playerIdx] = this.droppedItem.type;
        const itemName = this.droppedItem.type;
        this.droppedItem = null;
        return `✅ You caught the ${itemName}! Type *.m use* to use it!`;
    }

    useItem(playerIdx) {
        const item = this.inventory[playerIdx];
        if (!item) return "You don't have an item!";
        
        let effect = "";
        const myPoke = this.activePokemon[playerIdx];
        const oppPoke = this.activePokemon[1 - playerIdx];

        if (item === 'Health Pack') {
            const heal = Math.floor(myPoke.maxHp * 0.20);
            this.hp[playerIdx] = Math.min(myPoke.maxHp, this.hp[playerIdx] + heal);
            effect = `💖 used Health Pack! Restored ${heal} HP (+20%)!`;
        } else if (item === 'Poison Gas') {
            const damage = Math.floor(myPoke.maxHp * 0.20);
            this.hp[playerIdx] = Math.max(1, this.hp[playerIdx] - damage);
            effect = `☣️ used Poison Gas! It backfired and dealt ${damage} damage (-20%) to yourself!`;
        } else if (item === 'Fire Booster') {
            const damage = Math.floor(oppPoke.maxHp * 0.35);
            this.hp[1 - playerIdx] = Math.max(0, this.hp[1 - playerIdx] - damage);
            effect = `🔥 used Fire Booster! Dealt ${damage} damage (-35%) to the opponent!`;
        } else if (item === 'Energy Drink') {
            this.energy[playerIdx] = Math.min(100, this.energy[playerIdx] + 50);
            effect = `⚡ used Energy Drink! Restored 50 Energy!`;
        } else if (item === 'Shield') {
            effect = `🛡️ used Shield! (Visual only for now)`;
        }
        
        this.inventory[playerIdx] = null;
        return effect;
    }

    async resolveTurn() {
        const p1 = this.activePokemon[0];
        const p2 = this.activePokemon[1];
        const m1 = await getMoveData(this.moves[0]);
        const m2 = await getMoveData(this.moves[1]);

        let order = [0, 1];
        if (p2.speed > p1.speed) order = [1, 0];
        if (p2.speed === p1.speed && Math.random() > 0.5) order = [1, 0];

        const results = [];
        for (const i of order) {
            const attacker = this.activePokemon[i];
            const defender = this.activePokemon[1 - i];
            const move = i === 0 ? m1 : m2;
            const attackerEnergy = this.energy[i];

            if (this.hp[i] <= 0) continue;

            if (attackerEnergy < move.energy) {
                results.push(`${attacker.name} tried to use ${move.name} but didn't have enough energy!`);
                continue;
            }

            this.energy[i] -= move.energy;
            const damageResult = calculateDamage(attacker, defender, move);
            this.hp[1 - i] = Math.max(0, this.hp[1 - i] - damageResult.total);
            
            let log = `${attacker.name} used ${move.name}!`;
            if (damageResult.effectiveness > 1) log += " It's super effective!";
            if (damageResult.effectiveness < 1 && damageResult.effectiveness > 0) log += " It's not very effective...";
            if (damageResult.effectiveness === 0) log += " It had no effect...";
            results.push(log);
        }

        this.energy[0] = Math.min(100, this.energy[0] + 10);
        this.energy[1] = Math.min(100, this.energy[1] + 10);

        this.moves = [null, null];
        this.turn++;
        
        this.checkItemDrop();
        
        if (this.turn >= 25) {
            this.status = 'finished';
            const winner = this.hp[0] >= this.hp[1] ? 0 : 1;
            results.push(`⏳ Turn 25 reached! Time's up!`);
            this.logs = results;
            return results;
        }

        this.logs = results;

        if (this.hp[0] <= 0 || this.hp[1] <= 0) {
            this.status = 'finished';
            const winner = this.hp[0] > 0 ? 0 : 1;
            this.logs.push(`${this.activePokemon[winner].name} won the battle!`);
        }

        return results;
    }
}

const battles = new Map();

module.exports = { Battle, battles };
