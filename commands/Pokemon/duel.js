const { Battle, battles } = require('../../utils/battleEngine');
const { generateBattleImage } = require('../../utils/battleGenerator');
const { fetchPokemonData, calculateStat } = require('../../utils/pokemonUtils');
const { listPokemon, getCurrentHp } = require('../../utils/pokemonStorage');

const pendingDuels = new Map();

function toBattlePokemon(document, data) {
  const iv = document.iv || {};
  const ev = document.ev || {};
  const maxHp = calculateStat(data.stats.hp, iv.hp || 0, ev.hp || 0, document.level, true);
  return {
    ...document.toObject(),
    sprite: data.sprite,
    maxHp,
    hp: Math.min(maxHp, Math.max(0, Number(document.hp) || maxHp)),
    energy: 100,
  };
}

async function getActivePartyPokemon(sender) {
  const { pokemons } = await listPokemon(sender, 'party', 6);
  return pokemons.find((pokemon) => getCurrentHp(pokemon) > 0) || null;
}

async function renderDuel(sock, jid, message, battle, caption, mentions) {
  try {
    const image = await generateBattleImage({
      player: battle.activePokemon[0],
      opponent: battle.activePokemon[1],
      lastAction: caption,
      weather: battle.weather,
    });
    return sock.sendMessage(jid, { image, caption, mentions }, { quoted: message });
  } catch (error) {
    console.error('[DUEL IMAGE]', error.message);
    return sock.sendMessage(jid, { text: caption, mentions }, { quoted: message });
  }
}

moon({
  name: 'pduel',
  aliases: ['pd'],
  category: 'Pokémon',
  description: 'Challenge another trainer to a Pokémon duel.',
  usage: '.pduel @user | .pduel accept | .pduel decline',
  async execute(sock, jid, sender, args, m, { reply }) {
    const subcommand = String(args[0] || '').toLowerCase();

    if (['yes', 'accept'].includes(subcommand)) {
      const duel = pendingDuels.get(jid);
      if (!duel) return reply('❌ No pending duel request exists in this chat.');
      if (duel.opponent !== sender) return reply('❌ This duel request is not for you.');
      if (Date.now() > duel.expiresAt) {
        pendingDuels.delete(jid);
        return reply('❌ The duel request expired.');
      }

      const [challengerPokemon, opponentPokemon] = await Promise.all([
        getActivePartyPokemon(duel.challenger),
        getActivePartyPokemon(duel.opponent),
      ]);
      if (!challengerPokemon) {
        pendingDuels.delete(jid);
        return reply('❌ The challenger has no healthy Pokémon in their party.');
      }
      if (!opponentPokemon) return reply('❌ You have no healthy Pokémon in your party. Use `.party` or `.t2party <pc_index>`.');

      const [challengerData, opponentData] = await Promise.all([
        fetchPokemonData(challengerPokemon.name),
        fetchPokemonData(opponentPokemon.name),
      ]);
      const first = toBattlePokemon(challengerPokemon, challengerData);
      const second = toBattlePokemon(opponentPokemon, opponentData);

      const battle = new Battle(first, second);
      battle.activePokemon = [first, second];
      battle.players = [duel.challenger, duel.opponent];
      battle.type = 'pvp';
      await battle.start();
      battles.set(duel.challenger, battle);
      battles.set(duel.opponent, battle);
      pendingDuels.delete(jid);

      const caption = [
        '⚔️ *POKÉMON DUEL*',
        '',
        `@${duel.challenger.split('@')[0]} vs @${duel.opponent.split('@')[0]}`,
        `🌙 Weather: ${battle.weather}`,
        '',
        'Both trainers must use `.pb <move>` each turn.',
        'Use `.pmoves` to view your active Pokémon moves.',
      ].join('\n');
      return renderDuel(sock, jid, m, battle, caption, [duel.challenger, duel.opponent]);
    }

    if (['no', 'decline'].includes(subcommand)) {
      const duel = pendingDuels.get(jid);
      if (!duel || duel.opponent !== sender) return reply('❌ You have no pending duel request to decline.');
      pendingDuels.delete(jid);
      return reply(`❌ @${sender.split('@')[0]} declined the duel.`, { mentions: [sender] });
    }

    const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return reply('❌ Tag a user to challenge them. Usage: `.pduel @user`');
    if (target === sender) return reply('❌ You cannot challenge yourself.');
    if (battles.get(sender) || battles.get(target)) return reply('❌ One of those trainers is already in an active battle.');

    const challengerPokemon = await getActivePartyPokemon(sender);
    if (!challengerPokemon) return reply('❌ You need a healthy Pokémon in your party to duel. Use `.party` or `.t2party <pc_index>`.');

    pendingDuels.set(jid, {
      challenger: sender,
      opponent: target,
      expiresAt: Date.now() + 2 * 60 * 1000,
    });

    return sock.sendMessage(jid, {
      text: `⚔️ *DUEL REQUEST*\n\n@${sender.split('@')[0]} challenged @${target.split('@')[0]} to a Pokémon duel.\n\nType \`.pduel accept\` to accept or \`.pduel decline\` to decline.\n> This request expires in two minutes.`,
      mentions: [sender, target],
    }, { quoted: m });
  },
});

moon({
  name: 'pmoves',
  category: 'Pokémon',
  description: 'List moves for your active party Pokémon.',
  async execute(sock, jid, sender, args, m, { reply }) {
    const pokemon = await getActivePartyPokemon(sender);
    if (!pokemon) return reply('❌ You have no healthy Pokémon in your party.');
    const moves = Array.isArray(pokemon.moves) ? pokemon.moves : [];
    if (!moves.length) return reply('❌ This Pokémon has no moves.');

    const lines = [
      `📜 *${(pokemon.nickname || pokemon.name).toUpperCase()} — MOVES*`,
      '',
      ...moves.map((move, index) => `${index + 1}. \`${String(move).replace(/-/g, ' ')}\``),
      '',
      '> Use `.pb <move>` to attack during a battle.',
    ];
    return reply(lines.join('\n'));
  },
});
