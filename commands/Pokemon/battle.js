const Pokemon = require("../../models/pokemon");
const SpawnControl = require("../../models/athers/SpawnControl");
const { Battle, battles } = require("../../utils/battleEngine");
const { generateBattleImage } = require("../../utils/battleGenerator");
const { fetchPokemonData, generateIVs, calculateStat } = require("../../utils/pokemonUtils");

// .catch — Start a wild battle with the spawned Pokémon
moon({
    name: "catch",
    category: "Pokémon",
    description: "Battle the spawned Pokémon and catch it",
    async execute(sock, jid, sender, args, m, { reply }) {
        try {
            const spawn = await SpawnControl.findOne({ groupId: jid });
            if (!spawn || !spawn.active || !spawn.pokemon) return reply("❌ No wild Pokémon has spawned here!");

            const party = await Pokemon.find({ userId: sender, location: "party" }).limit(1).sort({ caughtAt: 1 });
            if (party.length === 0) return reply("❌ You need a Pokémon in your party to battle! Use `.start-journey` first.");

            const pData = await fetchPokemonData(party[0].name);
            const sData = await fetchPokemonData(spawn.pokemon);

            const playerPoke = {
                ...party[0].toObject(),
                sprite: pData.sprite,
                maxHp: calculateStat(pData.stats.hp, party[0].iv.hp, party[0].ev.hp, party[0].level, true),
                energy: 100,
            };
            const wildPoke = {
                ...sData,
                level: spawn.level,
                maxHp: calculateStat(sData.stats.hp, 15, 0, spawn.level, true),
                hp: calculateStat(sData.stats.hp, 15, 0, spawn.level, true),
                energy: 100,
            };

            const battle = new Battle(playerPoke, wildPoke);
            battle.activePokemon = [playerPoke, wildPoke];
            battle.hp = [playerPoke.maxHp, wildPoke.maxHp];
            battle.players = [sender, "wild"];
            battle.type = "wild";
            battle.groupId = jid;
            battle.status = "active";

            battles.set(sender, battle);

            let img;
            try {
                img = await generateBattleImage({
                    player: { ...playerPoke, hp: playerPoke.maxHp },
                    opponent: { ...wildPoke, hp: wildPoke.maxHp },
                    lastAction: `A wild ${spawn.pokemon.toUpperCase()} appeared!`,
                    weather: battle.weather,
                });
            } catch (e) {
                console.error("[CATCH IMAGE ERROR]", e);
            }

            const caption =
                `⚔️ *WILD BATTLE* ⚔️\n\n` +
                `You are battling a wild *${spawn.pokemon.toUpperCase()}* (Lv.${spawn.level})!\n` +
                `Use \`.pb <move>\` to attack!\n` +
                `Use \`.pmoves\` to see your moves.`;

            if (img) {
                return sock.sendMessage(jid, { image: img, caption }, { quoted: m });
            }
            return reply(caption);
        } catch (err) {
            console.error("[CATCH ERROR]", err);
            return reply("❌ Failed to start the battle. Please try again.");
        }
    }
});

// .pb — Use a move in battle
moon({
    name: "pb",
    aliases: ["battle"],
    category: "Pokémon",
    description: "Use a move during a Pokémon battle",
    async execute(sock, jid, sender, args, m, { reply }) {
        try {
            // Find the battle this sender is in
            let battle = battles.get(sender);
            if (!battle) {
                // Check if they're player 2 in a PvP battle
                for (const [key, b] of battles.entries()) {
                    if ((b.player2Id === sender || b.players?.[1] === sender) && b.status === "active") {
                        battle = b;
                        break;
                    }
                }
            }
            if (!battle) return reply("❌ You are not in a battle! Use `.catch` to start one.");
            if (battle.status !== "active") return reply("❌ This battle has already ended.");

            const moveInput = args.join(" ").trim();
            if (!moveInput) return reply("❌ Specify a move! Usage: `.pb <move name>`\nUse `.pmoves` to see your moves.");

            // Determine which player index this sender is
            const playerIdx = battle.players[0] === sender ? 0 : 1;

            // For wild battles, auto-submit a random move for the wild Pokémon
            if (battle.type === "wild") {
                const wildPoke = battle.activePokemon[1];
                const wildMove = wildPoke.moves?.[Math.floor(Math.random() * (wildPoke.moves?.length || 1))] || "tackle";
                battle.moves[0] = moveInput;
                battle.moves[1] = wildMove;
            } else {
                // PvP: store this player's move and wait for the other
                battle.moves[playerIdx] = moveInput;

                // If only one player has moved, wait
                if (battle.moves[0] === null || battle.moves[1] === null) {
                    return reply(`✅ Move submitted: \`${moveInput}\`\nWaiting for your opponent to move...`);
                }
            }

            // Both moves submitted — resolve the turn
            let results;
            try {
                results = await battle.resolveTurn();
            } catch (e) {
                console.error("[RESOLVE TURN ERROR]", e);
                return reply("❌ Battle error during turn resolution. Please try again.");
            }

            const lastAction = Array.isArray(results) ? results.join("\n") : String(results);

            // Sync HP back to activePokemon for image generation
            battle.activePokemon[0].hp = battle.hp[0];
            battle.activePokemon[1].hp = battle.hp[1];

            // Ensure sprites
            for (const p of battle.activePokemon) {
                if (!p.sprite) {
                    try {
                        const d = await fetchPokemonData(p.name);
                        p.sprite = d.sprite;
                    } catch {}
                }
            }

            let img;
            try {
                img = await generateBattleImage({
                    player: battle.activePokemon[0],
                    opponent: battle.activePokemon[1],
                    lastAction,
                    weather: battle.weather,
                    droppedItem: battle.droppedItem,
                });
            } catch (e) {
                console.error("[PB IMAGE ERROR]", e);
            }

            if (img) {
                await sock.sendMessage(jid, { image: img, caption: lastAction }, { quoted: m });
            } else {
                await reply(lastAction);
            }

            // Check if battle is over
            if (battle.status === "finished") {
                const winnerIdx = battle.hp[0] > 0 ? 0 : 1;
                const winnerId = battle.players[winnerIdx];

                if (battle.type === "wild" && winnerId === sender) {
                    // Catch the wild Pokémon
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
                            type2: data.type2 || null,
                            hp: calculateStat(data.stats.hp, ivs.hp, 0, spawn.level, true),
                            attack: calculateStat(data.stats.attack, ivs.attack, 0, spawn.level),
                            defense: calculateStat(data.stats.defense, ivs.defense, 0, spawn.level),
                            spAtk: calculateStat(data.stats.spAtk, ivs.spAtk, 0, spawn.level),
                            spDef: calculateStat(data.stats.spDef, ivs.spDef, 0, spawn.level),
                            speed: calculateStat(data.stats.speed, ivs.speed, 0, spawn.level),
                            iv: ivs,
                            moves: data.moves,
                            location: "pc",
                        });
                        spawn.active = false;
                        await spawn.save();
                        await sock.sendMessage(jid, {
                            text: `🎉 *CONGRATULATIONS!* 🎉\nYou defeated and caught the wild *${spawn.pokemon.toUpperCase()}*!\nIt has been sent to your PC. Use \`.p2party <id>\` to add it to your party.`
                        }, { quoted: m });
                    }
                } else if (battle.type === "pvp") {
                    const loserIdx = 1 - winnerIdx;
                    const loserId = battle.players[loserIdx];
                    await sock.sendMessage(jid, {
                        text:
                            `🏆 *DUEL OVER!* 🏆\n\n` +
                            `🥇 Winner: @${(winnerId || "").split("@")[0]}\n` +
                            `💀 Loser: @${(loserId || "").split("@")[0]}`,
                        mentions: [winnerId, loserId].filter(Boolean),
                    }, { quoted: m });
                }

                battles.delete(sender);
                if (battle.player2Id) battles.delete(battle.player2Id);
            }
        } catch (err) {
            console.error("[PB ERROR]", err);
            return reply("❌ Battle error: " + err.message);
        }
    }
});

// .m — Mid-battle item commands
moon({
    name: "m",
    category: "Pokémon",
    description: "Mid-battle item commands (.m c = catch item, .m use = use item)",
    async execute(sock, jid, sender, args, m, { reply }) {
        try {
            let battle = battles.get(sender);
            if (!battle) {
                for (const [, b] of battles.entries()) {
                    if ((b.player2Id === sender || b.players?.[1] === sender) && b.status === "active") {
                        battle = b;
                        break;
                    }
                }
            }
            if (!battle) return reply("❌ You are not in a battle!");

            const playerIdx = battle.players[0] === sender ? 0 : 1;
            const sub = (args[0] || "").toLowerCase();

            if (sub === "c" || sub === "catch") {
                const result = battle.catchItem(playerIdx);
                return reply(result);
            }
            if (sub === "use") {
                const result = battle.useItem(playerIdx);
                return reply(result);
            }
            return reply("❌ Usage: `.m c` to catch a dropped item, `.m use` to use your item.");
        } catch (err) {
            console.error("[M ERROR]", err);
            return reply("❌ Error: " + err.message);
        }
    }
});
