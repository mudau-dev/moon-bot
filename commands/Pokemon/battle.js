const Pokemon = require('../../models/pokemon');
const SpawnControl = require('../../models/athers/SpawnControl');
const { Battle, battles } = require('../../utils/battleEngine');
const { generateBattleImage } = require('../../utils/battleGenerator');
const { fetchPokemonData, fetchPokemonSpecies, generateIVs, rollGender, calculateStat } = require('../../utils/pokemonUtils');
const { listPokemon, getCurrentHp } = require('../../utils/pokemonStorage');
const { getPokeBall, getCatchMultiplier, inventoryId } = require('../../utils/pokeBalls');

function getBattleForUser(sender) {
  const direct = battles.get(sender);
  if (direct?.status === 'active') return direct;
  for (const battle of battles.values()) {
    if (battle.status === 'active' && battle.players.includes(sender)) return battle;
  }
  return null;
}

function getPlayerIndex(battle, sender) {
  return battle.players[0] === sender ? 0 : battle.players[1] === sender ? 1 : -1;
}

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

async function renderBattle(sock, jid, message, battle, lastAction) {
  for (const pokemon of battle.activePokemon) {
    if (!pokemon.sprite) {
      try {
        pokemon.sprite = (await fetchPokemonData(pokemon.name)).sprite;
      } catch (error) {
        console.warn('[BATTLE SPRITE]', error.message);
      }
    }
  }

  battle.activePokemon[0].hp = battle.hp[0];
  battle.activePokemon[1].hp = battle.hp[1];
  battle.activePokemon[0].energy = battle.energy[0];
  battle.activePokemon[1].energy = battle.energy[1];

  try {
    const image = await generateBattleImage({
      player: battle.activePokemon[0],
      opponent: battle.activePokemon[1],
      lastAction,
      weather: battle.weather,
      droppedItem: battle.droppedItem,
    });
    return sock.sendMessage(jid, { image, caption: lastAction }, { quoted: message });
  } catch (error) {
    console.error('[BATTLE IMAGE]', error.message);
    return sock.sendMessage(jid, { text: lastAction }, { quoted: message });
  }
}

async function persistBattleHp(battle) {
  const updates = battle.activePokemon
    .filter((pokemon, index) => battle.players[index] && battle.players[index] !== 'wild' && pokemon?.pokemonId)
    .map((pokemon, index) => Pokemon.updateOne(
      { pokemonId: pokemon.pokemonId },
      { $set: { hp: Math.max(0, Math.round(battle.hp[index])) } }
    ));
  await Promise.all(updates);
}

function removeBattle(battle) {
  battle.players.filter(Boolean).forEach((player) => battles.delete(player));
}

async function captureWildPokemon(sender, battle, ball) {
  const spawn = await SpawnControl.findOne({ groupId: battle.groupId });
  if (!spawn?.active || !spawn.pokemon) return { success: false, message: '❌ The wild Pokémon is no longer available.' };

  const data = await fetchPokemonData(spawn.pokemon);
  let species = { captureRate: null, genderRate: -1 };
  try {
    species = await fetchPokemonSpecies(spawn.pokemon);
  } catch (error) {
    console.warn('[CATCH SPECIES]', error.message);
  }

  const ivs = generateIVs();
  const maxHp = calculateStat(data.stats.hp, ivs.hp, 0, spawn.level, true);
  const caughtPokemon = await Pokemon.create({
    pokemonId: `PKMN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: sender,
    pokedexNumber: data.pokedexNumber,
    name: data.name,
    level: spawn.level,
    type1: data.type1,
    type2: data.type2 || null,
    hp: ball.healOnCatch ? maxHp : Math.max(1, Math.round(maxHp * 0.65)),
    attack: calculateStat(data.stats.attack, ivs.attack, 0, spawn.level),
    defense: calculateStat(data.stats.defense, ivs.defense, 0, spawn.level),
    spAtk: calculateStat(data.stats.spAtk, ivs.spAtk, 0, spawn.level),
    spDef: calculateStat(data.stats.spDef, ivs.spDef, 0, spawn.level),
    speed: calculateStat(data.stats.speed, ivs.speed, 0, spawn.level),
    iv: ivs,
    moves: data.moves,
    captureRate: species.captureRate,
    gender: rollGender(species.genderRate),
    happiness: ball.happinessOnCatch || 0,
    location: 'pc',
  });

  spawn.active = false;
  await spawn.save();
  battle.status = 'finished';
  battle.winnerIndex = 0;
  battle.finishedReason = 'captured';
  removeBattle(battle);

  return {
    success: true,
    pokemon: caughtPokemon,
    message: `🎉 *CAUGHT!*\n\n${ball.emoji} ${ball.name} caught *${data.name.toUpperCase()}*!\nIt was sent to your PC. Use \`.pc\` to view it and \`.t2party <index>\` to move it into your party.`,
  };
}

async function throwPokeBall(sender, battle, ballName) {
  if (battle.type !== 'wild') return '❌ Poké Balls can only be used in wild battles.';
  const ball = getPokeBall(ballName);
  if (!ball) return '❌ Unknown Poké Ball. Usage: `.pb pokeball <ball>`';

  const { owner } = await listPokemon(sender);
  const inventoryIndex = owner.user.inventory.findIndex((item) => item.id === inventoryId(ball));
  if (inventoryIndex < 0) return `❌ You do not own a ${ball.name}. Visit the shop to buy one.`;

  owner.user.inventory.splice(inventoryIndex, 1);
  await owner.user.save();

  const wildPokemon = battle.activePokemon[1];
  const hpRatio = Math.max(0, Math.min(1, battle.hp[1] / Math.max(1, wildPokemon.maxHp)));
  const multiplier = getCatchMultiplier(ball, wildPokemon, battle.turn);
  const baseChance = 0.18 + (1 - hpRatio) * 0.58;
  const caught = Number.isFinite(multiplier) ? Math.random() < Math.min(0.95, baseChance * multiplier) : true;

  if (!caught) {
    return `${ball.emoji} *${ball.name}* shook and broke free!\n> Lower the wild Pokémon's HP before trying again.`;
  }

  const captured = await captureWildPokemon(sender, battle, ball);
  return captured.message;
}

moon({
  name: 'catch',
  category: 'Pokémon',
  description: 'Start a battle with the wild Pokémon in this group.',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const spawn = await SpawnControl.findOne({ groupId: jid });
      if (!spawn?.active || !spawn.pokemon) return reply('❌ No wild Pokémon has spawned here.');
      if (getBattleForUser(sender)) return reply('❌ You are already in an active Pokémon battle.');

      const { pokemons } = await listPokemon(sender, 'party', 6);
      const active = pokemons.find((pokemon) => getCurrentHp(pokemon) > 0);
      if (!active) return reply('❌ You need a healthy Pokémon in your party to battle. Use `.party` or `.t2party <pc_index>`.');

      const [playerData, wildData] = await Promise.all([
        fetchPokemonData(active.name),
        fetchPokemonData(spawn.pokemon),
      ]);
      const player = toBattlePokemon(active, playerData);
      const wildMaxHp = calculateStat(wildData.stats.hp, 15, 0, spawn.level, true);
      const wild = {
        ...wildData,
        level: spawn.level,
        maxHp: wildMaxHp,
        hp: wildMaxHp,
        energy: 100,
      };

      const battle = new Battle(player, wild);
      battle.activePokemon = [player, wild];
      battle.players = [sender, 'wild'];
      battle.type = 'wild';
      battle.groupId = jid;
      await battle.start();
      battles.set(sender, battle);

      const caption = [
        '⚔️ *WILD BATTLE*',
        '',
        `A wild *${spawn.pokemon.toUpperCase()}* appeared at Lv.${spawn.level}!`,
        'Use `.pb <move>` to attack.',
        'Use `.pb pokeball <ball>` to throw a Poké Ball.',
        'Use `.pb run` to leave the encounter.',
      ].join('\n');
      return renderBattle(sock, jid, m, battle, caption);
    } catch (error) {
      console.error('[CATCH]', error);
      return reply('❌ Failed to start the battle. Please try again.');
    }
  },
});

moon({
  name: 'pb',
  aliases: ['battle'],
  category: 'Pokémon',
  description: 'Use a move, throw a Poké Ball, or leave an active Pokémon battle.',
  usage: '.pb <move> | .pb pokeball <ball> | .pb run',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const battle = getBattleForUser(sender);
      if (!battle) return reply('❌ You are not in a battle. Use `.catch` to start a wild encounter.');
      const playerIndex = getPlayerIndex(battle, sender);
      if (playerIndex < 0) return reply('❌ You are not a player in this battle.');

      const subcommand = String(args[0] || '').toLowerCase();
      if (['run', 'leave', 'flee'].includes(subcommand)) {
        battle.status = 'finished';
        battle.finishedReason = 'left';
        removeBattle(battle);
        return reply('🏃 You safely left the battle. The wild Pokémon is still available for another trainer.');
      }

      if (['pokeball', 'ball'].includes(subcommand)) {
        const result = await throwPokeBall(sender, battle, args.slice(1).join(' '));
        if (battle.status === 'finished') return reply(result);
        await renderBattle(sock, jid, m, battle, result);
        return undefined;
      }

      const moveInput = args.join(' ').trim();
      if (!moveInput) {
        return reply('❌ Usage: `.pb <move>`\n> You can also use `.pb pokeball <ball>` or `.pb run`.');
      }

      if (battle.type === 'wild') {
        const wildMoves = battle.activePokemon[1].moves || ['tackle'];
        battle.moves[0] = moveInput;
        battle.moves[1] = wildMoves[Math.floor(Math.random() * wildMoves.length)] || 'tackle';
      } else {
        battle.moves[playerIndex] = moveInput;
        if (battle.moves[0] === null || battle.moves[1] === null) {
          return reply(`✅ Move submitted: \`${moveInput}\`\nWaiting for your opponent to move…`);
        }
      }

      const results = await battle.resolveTurn();
      await persistBattleHp(battle);
      const summary = results.join('\n');
      await renderBattle(sock, jid, m, battle, summary);

      if (battle.status !== 'finished') return undefined;

      const winnerId = battle.players[battle.winnerIndex];
      if (battle.type === 'wild' && winnerId === sender) {
        const captured = await captureWildPokemon(sender, battle, {
          name: 'Battle Capture',
          emoji: '⚪',
          healOnCatch: false,
        });
        return reply(captured.message);
      }

      if (battle.type === 'pvp') {
        const loserId = battle.players[1 - battle.winnerIndex];
        removeBattle(battle);
        return sock.sendMessage(jid, {
          text: `🏆 *DUEL OVER!*\n\n🥇 Winner: @${winnerId.split('@')[0]}\n💀 Loser: @${loserId.split('@')[0]}`,
          mentions: [winnerId, loserId],
        }, { quoted: m });
      }

      removeBattle(battle);
      return reply('💤 Your Pokémon fainted. Heal your party before battling again.');
    } catch (error) {
      console.error('[PB]', error);
      return reply('❌ Battle error. Please try again.');
    }
  },
});

moon({
  name: 'm',
  category: 'Pokémon',
  description: 'Pick up or use a dropped battle item.',
  async execute(sock, jid, sender, args, m, { reply }) {
    const battle = getBattleForUser(sender);
    if (!battle) return reply('❌ You are not in a battle.');
    const playerIndex = getPlayerIndex(battle, sender);
    const subcommand = String(args[0] || '').toLowerCase();

    if (['c', 'catch'].includes(subcommand)) return reply(battle.catchItem(playerIndex));
    if (subcommand === 'use') {
      const result = battle.useItem(playerIndex);
      await persistBattleHp(battle);
      return reply(result);
    }
    return reply('❌ Usage: `.m catch` to pick up an item or `.m use` to use one.');
  },
});
