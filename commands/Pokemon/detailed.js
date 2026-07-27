const Pokemon = require("../../models/pokemon");

moon({
    name: "p2party",
    category: "Pokémon",
    description: "Move a Pokémon from PC to Party",

    async execute(sock, jid, sender, args, m, { reply }) {
        const pokemonId = args[0];
        if (!pokemonId) return reply("Usage: .p2party <pokemonId>");

        const partyCount = await Pokemon.countDocuments({
            userId: sender,
            location: "party"
        });

        if (partyCount >= 6) {
            return reply("❌ Your party already has 6 Pokémon.");
        }

        const pokemon = await Pokemon.findOne({
            userId: sender,
            pokemonId,
            location: "pc"
        });

        if (!pokemon) {
            return reply("❌ Pokémon not found in your PC.");
        }

        pokemon.location = "party";
        await pokemon.save();

        reply(`✅ ${pokemon.name} was moved to your party.`);
    }
});

moon({
    name: "t2pc",
    category: "Pokémon",
    description: "Move a Pokémon from Party to PC",

    async execute(sock, jid, sender, args, m, { reply }) {
        const pokemonId = args[0];
        if (!pokemonId) return reply("Usage: .t2pc <pokemonId>");

        const pokemon = await Pokemon.findOne({
            userId: sender,
            pokemonId,
            location: "party"
        });

        if (!pokemon) {
            return reply("❌ Pokémon not found in your party.");
        }

        pokemon.location = "pc";
        await pokemon.save();

        reply(`✅ ${pokemon.name} was moved to your PC.`);
    }
});