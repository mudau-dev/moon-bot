const Pokemon = require("../../models/pokemon");
const SpawnControl = require("../../models/athers/SpawnControl");
const { Battle, battles } = require("../../utils/battleEngine");
const { generateBattleImage } = require("../../utils/battleGenerator");
const { fetchPokemonData, generateIVs, calculateStat } = require("../../utils/pokemonUtils");

moon({
    name: "catch",
    category: "Pokémon",
    description: "Battle the spawned Pokémon and catch it",
    async execute(sock, jid, sender, args, m, { reply }) {
        const spawn = await SpawnControl.findOne({ groupId: jid });
        if (!spawn || !spawn.active || !spawn.pokemon) return reply("❌ No wild Pokémon has spawned here!");

        const party = await Pokemon.find({ userId: sender, location: "party" }).limit(1);
        if (party.length === 0) return reply("❌ You need a Pokémon in your party to battle! Use .start-journey first.");

        const pData = await fetchPokemonData(party[0].name);
        const sData = await fetchPokemonData(spawn.pokemon);

        const battle = new Battle(
            { ...party[0]._doc, sprite: pData.sprite, maxHp: calculateStat(pData.stats.hp, party[0].iv.hp, party[0].ev.hp, party[0].level, true), energy: 100 },
            { ...sData, level: spawn.level, maxHp: calculateStat(sData.stats.hp, 15, 0, spawn.level, true), hp: calculateStat(sData.stats.hp, 15, 0, spawn.level, true), energy: 100 }
        );
        battle.type = "wild";
        battle.groupId = jid;
        battles.set(sender, battle);

        const img = await generateBattleImage({
            player: battle.activePokemon[0],
            opponent: battle.activePokemon[1],
            lastAction: `A wild ${spawn.pokemon} appeared!`
        });

        return sock.sendMessage(jid, { image: img, caption: `⚔️ *WILD BATTLE* ⚔️\n\nYou are battling a wild *${spawn.pokemon.toUpperCase()}* (Lv.${spawn.level})!\nUse *.pb <move>* to attack!` }, { quoted: m });
    }
});

moon({
    name: "pb",
    category: "Pokémon",
    description: "Use a move during a Pokémon battle",
    async execute(sock, jid, sender, args, m, { reply }) {
        const battle = battles.get(sender) || Array.from(battles.values()).find(b => b.player2Id === sender && b.status === "active");
        if (!battle) return reply("❌ You are not in a battle!");

        const moveInput = args.join(" ");
        if (!moveInput) return reply("❌ Specify a move name or number!");

        const result = battle.turn(sender, moveInput);
        if (result.error) return reply(`❌ ${result.error}`);

        // Ensure sprites are present
        for (const p of battle.activePokemon) {
            if (!p.sprite) {
                const d = await fetchPokemonData(p.name);
                p.sprite = d.sprite;
            }
        }

        const img = await generateBattleImage({
            player: battle.activePokemon[0],
            opponent: battle.activePokemon[1],
            lastAction: result.message,
            round: battle.round
        });

        await sock.sendMessage(jid, { image: img, caption: result.message }, { quoted: m });

        if (battle.isOver) {
            if (battle.type === "wild" && battle.winner === sender) {
                const spawn = await SpawnControl.findOne({ groupId: battle.groupId });
                if (spawn && spawn.active) {
                    const data = await fetchPokemonData(spawn.pokemon);
                    const ivs = generateIVs();
                    await Pokemon.create({
                        pokemonId: "PKMN-" + Date.now(),
                        userId: sender,
                        pokedexNumber: data.pokedexNumber,
                        name: data.name,
                        level: spawn.level,
                        type1: data.type1,
                        type2: data.type2,
                        hp: calculateStat(data.stats.hp, ivs.hp, 0, spawn.level, true),
                        attack: calculateStat(data.stats.attack, ivs.attack, 0, spawn.level),
                        defense: calculateStat(data.stats.defense, ivs.defense, 0, spawn.level),
                        spAtk: calculateStat(data.stats.spAtk, ivs.spAtk, 0, spawn.level),
                        spDef: calculateStat(data.stats.spDef, ivs.spDef, 0, spawn.level),
                        speed: calculateStat(data.stats.speed, ivs.speed, 0, spawn.level),
                        iv: ivs,
                        moves: data.moves,
                        location: "pc"
                    });
                    spawn.active = false;
                    await spawn.save();
                    reply(`🎉 *CONGRATULATIONS!* 🎉\nYou defeated and caught the wild *${spawn.pokemon.toUpperCase()}*! It has been sent to your PC.`);
                }
            }
            battles.delete(sender);
        }
    }
});
