const axios = require("axios");

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
    generateIVs,
    calculateStat
};
