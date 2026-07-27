const Pokemon = require("../../models/pokemon");
const { generatePartyImage } = require("../../utils/partyGenerator");
const { fetchPokemonData, generateIVs, calculateStat } = require("../../utils/pokemonUtils");

moon({
    name: "heal",
    category: "Pokémon",
    description: "Heal your entire party",
    async execute(sock, jid, sender, args, m, { reply }) {
        const party = await Pokemon.find({ userId: sender, location: "party" });
        if (party.length === 0) return reply("❌ Your party is empty!");

        for (const p of party) {
            const data = await fetchPokemonData(p.name);
            p.hp = calculateStat(data.stats.hp, p.iv.hp, p.ev.hp, p.level, true);
            await p.save();
        }

        return reply("💖 Your Pokémon party has been fully healed!");
    }
});

moon({
    name: "pgive",
    category: "Pokémon",
    description: "Give a Pokémon from your party to another user",
    async execute(sock, jid, sender, args, m, { reply }) {
        const index = parseInt(args[0]) - 1;
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (isNaN(index) || !target) return reply("❌ Usage: .pgive <party_index> <@user>");

        const party = await Pokemon.find({ userId: sender, location: "party" }).limit(6).sort({ caughtAt: 1 });
        const p = party[index];
        if (!p) return reply("❌ Pokémon not found in your party!");

        p.userId = target;
        p.location = "pc";
        await p.save();

        return reply(`✅ You gave *${p.name.toUpperCase()}* to @${target.split("@")[0]}!`, { mentions: [target] });
    }
});

moon({
    name: "prent",
    category: "Pokémon",
    description: "View and rent Pokémon for battle",
    async execute(sock, jid, sender, args, m, { reply }) {
        const rentalNames = ["Mewtwo", "Rayquaza", "Arceus", "Lucario", "Garchomp", "Greninja", "Charizard"];
        const index = parseInt(args[0]) - 1;

        if (isNaN(index)) {
            let text = "🏢 *POKÉMON RENTAL CENTER* 🏢\n\nAvailable for rent (Lv.100):\n";
            rentalNames.forEach((name, i) => text += `${i + 1}. *${name}*\n`);
            text += "\nUsage: .prent <index>";
            return reply(text);
        }

        const name = rentalNames[index];
        if (!name) return reply("❌ Invalid rental index.");

        const data = await fetchPokemonData(name);
        const ivs = { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 };
        const level = 100;

        await Pokemon.create({
            pokemonId: "RENT-" + Date.now(),
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

        return sock.sendMessage(jid, { image: { url: data.sprite }, caption: `✅ You rented *${data.name.toUpperCase()}*! It has been added to your party.` }, { quoted: m });
    }
});

moon({
    name: "pmove",
    category: "Pokémon",
    description: "Rearrange a Pokémon's move order",
    async execute(sock, jid, sender, args, m, { reply }) {
        const pIndex = parseInt(args[0]) - 1;
        const m1 = parseInt(args[1]) - 1;
        const m2 = parseInt(args[2]) - 1;

        if (isNaN(pIndex) || isNaN(m1) || isNaN(m2)) return reply("❌ Usage: .pmove <party_index> <move_1> <move_2>");

        const party = await Pokemon.find({ userId: sender, location: "party" }).limit(6).sort({ caughtAt: 1 });
        const p = party[pIndex];
        if (!p) return reply("❌ Pokémon not found in your party!");

        const temp = p.moves[m1];
        p.moves[m1] = p.moves[m2];
        p.moves[m2] = temp;
        p.markModified("moves");
        await p.save();

        return reply(`✅ Rearranged moves for *${p.name.toUpperCase()}*!`);
    }
});
