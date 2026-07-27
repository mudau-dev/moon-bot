const SpawnControl = require("../../models/athers/SpawnControl");
const { fetchPokemonData } = require("../../utils/pokemonUtils");

moon({
    name: "pspawn",
    category: "Pokémon",
    roles: ["Owner", "True Owner"],
    description: "Manage wild Pokémon spawns",
    async execute(sock, jid, sender, args, m, { reply }) {
        const sub = (args[0] || "").toLowerCase();
        let spawn = await SpawnControl.findOne({ groupId: jid });
        if (!spawn) spawn = new SpawnControl({ groupId: jid });

        if (sub === "on") {
            spawn.enabled = true;
            await spawn.save();
            return reply("✅ Wild Pokémon spawns enabled in this group!");
        }

        if (sub === "off") {
            spawn.enabled = false;
            spawn.active = false;
            await spawn.save();
            return reply("✅ Wild Pokémon spawns disabled in this group!");
        }

        if (sub === "force") {
            const name = args.slice(1).join(" ");
            if (!name) return reply("❌ Usage: .pspawn force <pokemon>");
            
            try {
                const data = await fetchPokemonData(name);
                const level = Math.floor(Math.random() * 30) + 5;
                
                spawn.active = true;
                spawn.pokemon = data.name;
                spawn.level = level;
                await spawn.save();

                return sock.sendMessage(jid, { 
                    image: { url: data.sprite }, 
                    caption: `🌟 *WILD POKÉMON FORCED!* 🌟\n\nA wild *${data.name.toUpperCase()}* (Lv.${level}) has appeared! Use *.catch* to battle!` 
                }, { quoted: m });
            } catch (e) {
                return reply(`❌ Error spawning Pokémon: ${e.message}`);
            }
        }

        return reply("📌 Usage:\n.pspawn on/off\n.pspawn force <pokemon>");
    }
});

moon({
    name: "gpoke",
    category: "Pokémon",
    roles: ["Owner", "True Owner"],
    description: "Give a Pokémon to a user",
    async execute(sock, jid, sender, args, m, { reply }) {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant;
        const pokemonName = args.slice(target ? 1 : 0).join(" ");

        if (!target || !pokemonName) return reply("❌ Usage: .gpoke <@user> <pokemon> (or reply to a user)");

        const Pokemon = require("../../models/pokemon");
        const { fetchPokemonData, generateIVs, calculateStat } = require("../../utils/pokemonUtils");

        try {
            const data = await fetchPokemonData(pokemonName);
            const ivs = generateIVs();
            const level = 50;

            await Pokemon.create({
                pokemonId: "GIVE-" + Date.now(),
                userId: target,
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
                location: "pc"
            });

            return reply(`✅ Gave *${data.name.toUpperCase()}* to @${target.split("@")[0]}!`, { mentions: [target] });
        } catch (e) {
            return reply(`❌ Error giving Pokémon: ${e.message}`);
        }
    }
});
