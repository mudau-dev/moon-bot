const axios = require('axios');

const TYPE_CHART = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

const MOVE_CACHE = new Map();

async function getMoveData(moveName) {
    if (MOVE_CACHE.has(moveName)) return MOVE_CACHE.get(moveName);
    try {
        const res = await axios.get(`https://pokeapi.co/api/v2/move/${moveName.toLowerCase().replace(/ /g, '-')}`);
        const data = {
            name: res.data.name,
            power: res.data.power || 0,
            accuracy: res.data.accuracy || 100,
            type: res.data.type.name,
            damageClass: res.data.damage_class.name,
            energy: Math.floor((res.data.power || 20) / 2.5) + 10 // Custom energy cost
        };
        MOVE_CACHE.set(moveName, data);
        return data;
    } catch (err) {
        return { name: moveName, power: 40, accuracy: 100, type: 'normal', damageClass: 'physical', energy: 15 };
    }
}

function getEffectiveness(moveType, targetTypes) {
    let multiplier = 1;
    targetTypes.forEach(type => {
        if (type && TYPE_CHART[moveType] && TYPE_CHART[moveType][type] !== undefined) {
            multiplier *= TYPE_CHART[moveType][type];
        }
    });
    return multiplier;
}

function calculateDamage(attacker, defender, move) {
    if (move.power === 0) return 0;
    
    const level = attacker.level;
    const atk = move.damageClass === 'special' ? attacker.spAtk : attacker.attack;
    const def = move.damageClass === 'special' ? defender.spDef : defender.defense;
    
    let damage = (((2 * level / 5 + 2) * move.power * atk / def) / 50) + 2;
    
    // Type effectiveness
    const effectiveness = getEffectiveness(move.type, [defender.type1, defender.type2]);
    damage *= effectiveness;
    
    // Random factor
    const random = (Math.floor(Math.random() * 16) + 85) / 100;
    damage *= random;
    
    return {
        total: Math.floor(damage),
        effectiveness
    };
}


async function fetchPokemonData(name) {
    const query = String(name).toLowerCase().replace(/\s+/g, "-");

    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${query}`);

    const stat = (name) =>
        data.stats.find(s => s.stat.name === name)?.base_stat || 0;

    return {
        pokedexNumber: data.id,
        name: data.name,
        sprite: data.sprites.other["official-artwork"].front_default ||
                data.sprites.front_default,

        type1: data.types[0]?.type?.name || null,
        type2: data.types[1]?.type?.name || null,

        stats: {
            hp: stat("hp"),
            attack: stat("attack"),
            defense: stat("defense"),
            spAtk: stat("special-attack"),
            spDef: stat("special-defense"),
            speed: stat("speed")
        },

        moves: data.moves
            .slice(0, 4)
            .map(m => m.move.name.replace(/-/g, " "))
    };
}

async function fetchPokemonSpecies(name) {
    const query = String(name).toLowerCase().replace(/\s+/g, "-");
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${query}`);
    return {
        captureRate: Number.isFinite(data.capture_rate) ? data.capture_rate : null,
        genderRate: Number.isFinite(data.gender_rate) ? data.gender_rate : -1,
    };
}

function rollGender(genderRate) {
    if (genderRate === -1) return 'Genderless';
    if (genderRate === 0) return 'Male';
    if (genderRate === 8) return 'Female';
    return Math.random() < genderRate / 8 ? 'Female' : 'Male';
}

function generateIVs() {
    const rand = () => Math.floor(Math.random() * 32);

    return {
        hp: rand(),
        attack: rand(),
        defense: rand(),
        spAtk: rand(),
        spDef: rand(),
        speed: rand()
    };
}

function calculateStat(base, iv, ev = 0, level = 50, hp = false) {
    if (hp) {
        return Math.floor((((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10);
    }

    return Math.floor(((((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5));
}

module.exports = {
    fetchPokemonData,
    fetchPokemonSpecies,
    rollGender,
    generateIVs,
    calculateStat,
    getMoveData,
    getEffectiveness,
    calculateDamage
};
