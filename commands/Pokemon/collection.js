const Pokemon = require("../../models/pokemon");
const { generatePCImage } = require("../../utils/pcGenerator");
const { generatePartyImage } = require("../../utils/partyGenerator");
const { generateProfileImage } = require("../../utils/profileGenerator");
const { fetchPokemonData } = require("../../utils/pokemonUtils");

moon({
    name: "pc",
    category: "Pokémon",
    description: "View your Pokémon collection",
    async execute(sock, jid, sender, args, m, { reply }) {
        const page = parseInt(args[0]) || 1;
        const limit = 30;
        const skip = (page - 1) * limit;

        const total = await Pokemon.countDocuments({ userId: sender });
        const pokemons = await Pokemon.find({ userId: sender }).skip(skip).limit(limit).sort({ caughtAt: -1 });

        if (pokemons.length === 0) return reply("❌ Your PC is empty!");

        const buffer = await generatePCImage(pokemons, page, total);
        return sock.sendMessage(jid, { image: buffer, caption: `📱 *YOUR POKÉMON COLLECTION* (Page ${page})\nTotal: ${total} Pokémon` }, { quoted: m });
    }
});

moon({
    name: "party",
    category: "Pokémon",
    description: "View your active Pokémon party",
    async execute(sock, jid, sender, args, m, { reply }) {
        const party = await Pokemon.find({ userId: sender, location: "party" }).limit(6).sort({ caughtAt: 1 });
        if (party.length === 0) return reply("❌ Your party is empty!");

        const buffer = await generatePartyImage(party);
        return sock.sendMessage(jid, { image: buffer, caption: `🎒 *YOUR POKÉMON PARTY*` }, { quoted: m });
    }
});

moon({
    name: "pokemon",
    aliases: ["profile", "trainer"],
    category: "Pokémon",
    description: "View your trainer profile and Pokémon stats",
    async execute(sock, jid, sender, args, m, { reply }) {
        const total = await Pokemon.countDocuments({ userId: sender });
        const shinies = await Pokemon.countDocuments({ userId: sender, isShiny: true });
        const party = await Pokemon.find({ userId: sender, location: "party" }).limit(6);

        const buffer = await generateProfileImage({
            name: m.pushName || "Trainer",
            total,
            shinies,
            party
        });
        return sock.sendMessage(jid, { image: buffer, caption: `👤 *TRAINER PROFILE: ${m.pushName.toUpperCase()}*` }, { quoted: m });
    }
});

moon({
    name: "poke",
    category: "Pokémon",
    description: "View details of a specific Pokémon",
    async execute(sock, jid, sender, args, m, { reply }) {
        const id = args[0];
        if (!id) return reply("❌ Usage: .poke <pokemon_id>");

        const p = await Pokemon.findOne({ userId: sender, pokemonId: id });
        if (!p) return reply("❌ Pokémon not found in your collection.");

        const data = await fetchPokemonData(p.name);
        let text = `📜 *POKÉMON DETAILS: ${p.name.toUpperCase()}* 📜\n\n`;
        text += `🆔 ID: \`${p.pokemonId}\`\n`;
        text += `🧬 Type: ${p.type1}${p.type2 ? "/" + p.type2 : ""}\n`;
        text += `📈 Level: ${p.level}\n`;
        text += `❤️ HP: ${Math.ceil(p.hp)}\n`;
        text += `⚔️ ATK: ${p.attack} | 🛡️ DEF: ${p.defense}\n`;
        text += `🔮 SP.ATK: ${p.spAtk} | 🌀 SP.DEF: ${p.spDef}\n`;
        text += `⚡ SPEED: ${p.speed}\n\n`;
        text += `✨ IVs: ${p.iv.hp}/${p.iv.attack}/${p.iv.defense}/${p.iv.spAtk}/${p.iv.spDef}/${p.iv.speed} (${Math.round((Object.values(p.iv).reduce((a, b) => a + b, 0) / 186) * 100)}%)\n`;
        text += `🤺 Moves: ${p.moves.join(", ")}`;

        return sock.sendMessage(jid, { image: { url: data.sprite }, caption: text }, { quoted: m });
    }
});
