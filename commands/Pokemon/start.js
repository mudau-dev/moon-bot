const Pokemon = require("../../models/pokemon");
const { fetchPokemonData, generateIVs, calculateStat } = require("../../utils/pokemonUtils");

moon({
    name: "start-journey",
    aliases: ["startjourney", "sj"],
    category: "Pokémon",
    description: "Begin your Pokémon journey and pick a starter",
    async execute(sock, jid, sender, args, m, { reply, replyWithImage }) {
        const existing = await Pokemon.findOne({ userId: sender });
        if (existing) return reply("❌ You have already started your journey!");

        const starters = [
            "Bulbasaur", "Charmander", "Squirtle", 
            "Chikorita", "Cyndaquil", "Totodile",
            "Treecko", "Torchic", "Mudkip",
            "Turtwig", "Chimchar", "Piplup",
            "Snivy", "Tepig", "Oshawott"
        ];

        const choice = (args[0] || "").toLowerCase();

        if (!choice) {
            let text = "🌱 *WELCOME TO THE POKÉMON WORLD!* 🌱\n\nPick your starter Pokémon from the image above!\n\n";
            text += "*Kanto:* Bulbasaur, Charmander, Squirtle\n";
            text += "*Johto:* Chikorita, Cyndaquil, Totodile\n";
            text += "*Hoenn:* Treecko, Torchic, Mudkip\n";
            text += "*Sinnoh:* Turtwig, Chimchar, Piplup\n";
            text += "*Unova:* Snivy, Tepig, Oshawott\n\n";
            text += "Usage: .start-journey <name>";
            
            // Using a composite image of all starters
            return replyWithImage("https://files.catbox.moe/5m3n5y.jpg", text);
        }

        const starterName = starters.find(s => s.toLowerCase() === choice);
        if (!starterName) return reply("❌ Invalid starter choice. Pick one from the list!");

        const data = await fetchPokemonData(starterName);
        const ivs = generateIVs();
        const level = 5;

        await Pokemon.create({
            pokemonId: "STARTER-" + Date.now(),
            userId: sender,
            pokedexNumber: data.pokedexNumber,
            name: data.name,
            level: level,
            type1: data.type1,
            type2: data.type2,
            hp: calculateStat(data.stats.hp, ivs.hp, 0, level, true),
            attack: calculateStat(data.stats.attack, ivs.attack, 0, level),
            defense: calculateStat(data.stats.defense, ivs.defense, 0, level),
            spAtk: calculateStat(data.stats.spAtk, ivs.spAtk, 0, level),
            spDef: calculateStat(data.stats.spDef, ivs.spDef, 0, level),
            speed: calculateStat(data.stats.speed, ivs.speed, 0, level),
            iv: ivs,
            moves: data.moves,
            location: "party"
        });

        return sock.sendMessage(jid, { image: { url: data.sprite }, caption: `🎉 *CONGRATULATIONS!* 🎉\n\nYou picked *${data.name.toUpperCase()}* as your partner! Your journey begins now!` }, { quoted: m });
    }
});
