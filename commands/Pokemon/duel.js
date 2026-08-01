const Pokemon = require("../../models/pokemon");
const { Battle, battles } = require("../../utils/battleEngine");
const { generateBattleImage } = require("../../utils/battleGenerator");
const { fetchPokemonData, calculateStat } = require("../../utils/pokemonUtils");

const pendingDuels = new Map(); // jid -> { challenger, opponent, expiresAt }

// Helper: find which player index a sender is in a battle
function getPlayerIndex(battle, sender) {
    if (battle.players[0] === sender) return 0;
    if (battle.players[1] === sender || battle.player2Id === sender) return 1;
    return -1;
}

moon({
    name: "pduel",
    aliases: ["pd"],
    category: "Pokémon",
    description: "Challenge another user to a Pokémon duel",
    async execute(sock, jid, sender, args, m, { reply }) {
        const sub = (args[0] || "").toLowerCase();

        // ── Accept ──────────────────────────────────────────────────────────
        if (sub === "yes" || sub === "accept") {
            const duel = pendingDuels.get(jid);
            if (!duel) return reply("❌ No pending duel request in this chat!");
            if (duel.opponent !== sender) return reply("❌ This duel request is not for you!");
            if (Date.now() > duel.expiresAt) {
                pendingDuels.delete(jid);
                return reply("❌ The duel request has expired.");
            }

            // Fetch party Pokémon for both players
            const p1List = await Pokemon.find({ userId: duel.challenger, location: "party" }).limit(1).sort({ caughtAt: 1 });
            const p2List = await Pokemon.find({ userId: duel.opponent, location: "party" }).limit(1).sort({ caughtAt: 1 });

            if (p1List.length === 0) return reply("❌ The challenger has no Pokémon in their party!");
            if (p2List.length === 0) return reply("❌ You have no Pokémon in your party! Use `.p2party <id>` to add one.");

            const p1Doc = p1List[0];
            const p2Doc = p2List[0];

            const d1 = await fetchPokemonData(p1Doc.name);
            const d2 = await fetchPokemonData(p2Doc.name);

            const poke1 = {
                ...p1Doc.toObject(),
                sprite: d1.sprite,
                maxHp: calculateStat(d1.stats.hp, p1Doc.iv.hp, p1Doc.ev.hp, p1Doc.level, true),
                energy: 100,
            };
            const poke2 = {
                ...p2Doc.toObject(),
                sprite: d2.sprite,
                maxHp: calculateStat(d2.stats.hp, p2Doc.iv.hp, p2Doc.ev.hp, p2Doc.level, true),
                energy: 100,
            };

            // Create battle and set activePokemon BEFORE calling start()
            const battle = new Battle(poke1, poke2);
            battle.activePokemon = [poke1, poke2];
            battle.hp = [poke1.maxHp, poke2.maxHp];
            battle.players = [duel.challenger, duel.opponent];
            battle.player2Id = duel.opponent;
            battle.type = "pvp";
            battle.status = "active";

            battles.set(duel.challenger, battle);
            battles.set(duel.opponent, battle);
            pendingDuels.delete(jid);

            let img;
            try {
                img = await generateBattleImage({
                    player: { ...poke1, hp: poke1.maxHp },
                    opponent: { ...poke2, hp: poke2.maxHp },
                    lastAction: "The duel has begun! Use `.pb <move>` to attack!",
                    weather: battle.weather,
                });
            } catch (e) {
                console.error("[DUEL IMAGE ERROR]", e);
            }

            const caption =
                `⚔️ *POKÉMON DUEL* ⚔️\n\n` +
                `@${duel.challenger.split("@")[0]} vs @${duel.opponent.split("@")[0]}!\n\n` +
                `🌤️ Weather: ${battle.weather}\n` +
                `Use \`.pb <move>\` to attack!\n` +
                `Use \`.pmoves\` to see your Pokémon's moves.`;

            if (img) {
                return sock.sendMessage(jid, { image: img, caption }, { mentions: [duel.challenger, duel.opponent], quoted: m });
            }
            return reply(caption);
        }

        // ── Decline ─────────────────────────────────────────────────────────
        if (sub === "no" || sub === "decline") {
            const duel = pendingDuels.get(jid);
            if (!duel || duel.opponent !== sender) return reply("❌ You have no pending duel requests to decline!");
            pendingDuels.delete(jid);
            return reply(`❌ @${sender.split("@")[0]} declined the duel.`, { mentions: [sender] });
        }

        // ── Challenge ────────────────────────────────────────────────────────
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user to challenge them! Usage: `.pduel @user`");
        if (target === sender) return reply("❌ You cannot challenge yourself!");

        // Check challenger has a party
        const myParty = await Pokemon.find({ userId: sender, location: "party" }).limit(1);
        if (myParty.length === 0) return reply("❌ You need a Pokémon in your party to duel! Use `.p2party <id>`.");

        pendingDuels.set(jid, {
            challenger: sender,
            opponent: target,
            expiresAt: Date.now() + 2 * 60 * 1000, // 2 min to accept
        });

        return sock.sendMessage(jid, {
            text:
                `⚔️ *DUEL REQUEST* ⚔️\n\n` +
                `@${sender.split("@")[0]} has challenged @${target.split("@")[0]} to a Pokémon duel!\n\n` +
                `Type \`.pduel yes\` to accept or \`.pduel no\` to decline.\n` +
                `_(Expires in 2 minutes)_`,
            mentions: [sender, target],
        }, { quoted: m });
    }
});

// .pmoves — List your active Pokémon's moves
moon({
    name: "pmoves",
    category: "Pokémon",
    description: "List your active Pokémon's moves",
    async execute(sock, jid, sender, args, m, { reply }) {
        const party = await Pokemon.find({ userId: sender, location: "party" }).limit(1).sort({ caughtAt: 1 });
        if (party.length === 0) return reply("❌ You have no Pokémon in your party!");
        const p = party[0];
        let text = `📜 *${(p.nickname || p.name).toUpperCase()} — MOVES*\n\n`;
        if (!p.moves || p.moves.length === 0) return reply("❌ This Pokémon has no moves!");
        p.moves.forEach((move, i) => {
            text += `${i + 1}. \`${move}\`\n`;
        });
        text += `\n> Use \`.pb <move name>\` to attack in battle.`;
        return reply(text);
    }
});
