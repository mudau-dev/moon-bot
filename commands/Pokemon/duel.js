const Pokemon = require("../../models/pokemon");
const { Battle, battles } = require("../../utils/battleEngine");
const { generateBattleImage } = require("../../utils/battleGenerator");
const { fetchPokemonData, calculateStat } = require("../../utils/pokemonUtils");

const pendingDuels = new Map();

moon({
    name: "pduel",
    aliases: ["pd"],
    category: "Pokémon",
    description: "Start or accept a Pokémon duel",
    async execute(sock, jid, sender, args, m, { reply }) {
        const sub = (args[0] || "").toLowerCase();

        if (sub === "yes" || sub === "accept") {
            const duel = pendingDuels.get(jid);
            if (!duel || duel.opponent !== sender) return reply("❌ You have no pending duel requests!");

            const p1 = await Pokemon.find({ userId: duel.challenger, location: "party" }).limit(1);
            const p2 = await Pokemon.find({ userId: duel.opponent, location: "party" }).limit(1);

            if (p1.length === 0 || p2.length === 0) return reply("❌ Both players must have a Pokémon in their party!");

            const d1 = await fetchPokemonData(p1[0].name);
            const d2 = await fetchPokemonData(p2[0].name);

            const battle = new Battle(
                { ...p1[0]._doc, sprite: d1.sprite, maxHp: calculateStat(d1.stats.hp, p1[0].iv.hp, p1[0].ev.hp, p1[0].level, true), energy: 100 },
                { ...p2[0]._doc, sprite: d2.sprite, maxHp: calculateStat(d2.stats.hp, p2[0].iv.hp, p2[0].ev.hp, p2[0].level, true), energy: 100 }
            );
            battle.type = "pvp";
            battle.player2Id = sender;
            battles.set(duel.challenger, battle);
            pendingDuels.delete(jid);

            const img = await generateBattleImage({
                player: battle.activePokemon[0],
                opponent: battle.activePokemon[1],
                lastAction: "The duel has begun!"
            });

            return sock.sendMessage(jid, { image: img, caption: `⚔️ *POKÉMON DUEL* ⚔️\n\n@${duel.challenger.split("@")[0]} vs @${duel.opponent.split("@")[0]}!\nUse *.pb <move>* to attack!` }, { mentions: [duel.challenger, duel.opponent], quoted: m });
        }

        if (sub === "no" || sub === "decline") {
            const duel = pendingDuels.get(jid);
            if (!duel || duel.opponent !== sender) return reply("❌ You have no pending duel requests!");
            pendingDuels.delete(jid);
            return reply("❌ Duel request declined.");
        }

        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user to challenge them to a duel!");
        if (target === sender) return reply("❌ You cannot challenge yourself!");

        pendingDuels.set(jid, { challenger: sender, opponent: target });
        return reply(`⚔️ @${sender.split("@")[0]} has challenged @${target.split("@")[0]} to a Pokémon duel!\nType *.pduel yes* to accept or *.pduel no* to decline.`, { mentions: [sender, target] });
    }
});
