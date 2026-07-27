/**
 * commands/legacy/battle.js
 * .duelreq @user | .duel yes/no | .use <skill>
 * Handles PvP and PvE (Bot) turns.
 */
const LegacyPlayer = require('../../models/LegacyPlayer');
const LegacyBattle = require('../../models/LegacyBattle');
const { generateBattleCard, generateResultCard } = require('../../utils/legacyImageGen');
const { SKILLS } = require('../../utils/skillLibrary');

moon({
  name: 'duelreq',
  aliases: ['challenge-user'],
  category: 'legacy',
  description: 'Challenge a user to a Legacy duel',
  async execute(sock, jid, sender, args, m, { reply, isGroup, mentionedJid }) {
    if (!jid.endsWith('@g.us')) {
  return reply('❌ Duels can only be played in groups.');
    }
    
    // Group check
    const Group = require('../../models/athers/Group');
    const group = await Group.findOne({ groupId: jid });
    if (!group || !group.legacyBattlesEnabled) {
      return reply(
        `❌ *Legacy Battles* are disabled in this group.\n\n` +
        `Join the official group to battle:\n` +
        `https://chat.whatsapp.com/FeNoHhQm1lvLSVKSS43Zaq`
      );
    }

    // Get target from mention or replied message
const target =
  m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
  m.message?.extendedTextMessage?.contextInfo?.participant;

if (!target) {
  return reply(
    '❌ Mention a user or reply to one of their messages.\n\n' +
    'Examples:\n' +
    '• .duelreq @user\n' +
    '• Reply to a user\'s message with .duelreq'
  );
}

if (target === sender) {
  return reply('❌ You cannot duel yourself.');
}
    if (target === sender) return reply('❌ You cannot duel yourself.');

    const p1 = await LegacyPlayer.findOne({ whatsappId: sender });
    const p2 = await LegacyPlayer.findOne({ whatsappId: target });

    if (!p1) return reply('❌ You need a Legacy account. Use *.genesis*.');
    if (!p2) return reply('❌ That user does not have a Legacy account.');
    if (!p1.class || !p2.class) return reply('❌ Both players must choose a class first.');

    // Check active
    const active = await LegacyBattle.findOne({ 
      $or: [{ player1Id: sender }, { player2Id: sender }, { player1Id: target }, { player2Id: target }],
      status: 'active'
    });
    if (active) return reply('⚠️ One of you is already in a battle!');

    await LegacyBattle.create({
      player1Id: sender,
      player2Id: target,
      player1Data: { name: p1.name, hp: p1.hp, maxHp: p1.maxHp, mana: p1.mana, maxMana: p1.maxMana, level: p1.level, rank: p1.rank },
      player2Data: { name: p2.name, hp: p2.hp, maxHp: p2.maxHp, mana: p2.mana, maxMana: p2.maxMana, level: p2.level, rank: p2.rank },
      status: 'pending',
      turn: target,
    });

    return reply(`⚔️ *DUEL CHALLENGE*\n\n@${sender.split('@')[0]} challenged @${target.split('@')[0]}!\n\nType *.duel yes* to accept or *.duel no* to decline.`, { mentions: [sender, target] });
  }
});

moon({
  name: 'duel',
  category: 'legacy',
  async execute(sock, jid, sender, args, m, { reply }) {
    const choice = (args[0] || '').toLowerCase();
    const battle = await LegacyBattle.findOne({ player2Id: sender, status: 'pending' }).sort({ createdAt: -1 });

    if (!battle) return reply('❌ You have no pending duel requests.');

    if (choice === 'no') {
      battle.status = 'finished';
      await battle.save();
      return reply('❌ Duel declined.');
    }

    if (choice === 'yes') {
      battle.status = 'active';
      battle.round = 1;
      await battle.save();

      let p1Av = null, p2Av = null;
      try { p1Av = await sock.profilePictureUrl(battle.player1Id, 'image'); } catch {}
      try { p2Av = await sock.profilePictureUrl(battle.player2Id, 'image'); } catch {}

      const img = await generateBattleCard(
        { ...battle.player1Data, avatarUrl: p1Av },
        { ...battle.player2Data, avatarUrl: p2Av },
        1,
        battle.player2Data.name
      );

      return await sock.sendMessage(jid, {
        image: img,
        caption: `⚔️ *DUEL ACCEPTED!* ⚔️\n\nRound 1\nIt is *${battle.player2Data.name}'s* turn!\nUse *.use <skill name>*`
      }, { quoted: m });
    }
  }
});

moon({
  name: 'use',
  aliases: ['u', 'cast'],
  category: 'legacy',
  description: 'Use a skill in battle',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const battle = await LegacyBattle.findOne({ 
        $or: [{ player1Id: sender }, { player2Id: sender }],
        status: 'active'
      });

      if (!battle) return reply('❌ You are not in an active battle.');
      if (battle.turn !== sender) return reply(`⏳ It is not your turn! Waiting for *${battle.turn === battle.player1Id ? battle.player1Data.name : battle.player2Data.name}*.`);

      const skillName = args.join(' ').toLowerCase();
      const player = await LegacyPlayer.findOne({ whatsappId: sender });
      
      const skill = SKILLS.find(s => s.name.toLowerCase() === skillName);
      if (!skill) return reply('❌ Skill not found. Check *.skills* for your moves.');
      
      // Check if player has the skill
      if (!player.skills.includes(skill.name)) return reply(`❌ You haven't unlocked *${skill.name}* yet.`);
      
      const isP1 = battle.player1Id === sender;
      const attacker = isP1 ? battle.player1Data : battle.player2Data;
      const defender = isP1 ? battle.player2Data : battle.player1Data;

      if (attacker.mana < skill.mana) return reply(`💧 Not enough mana! (Need ${skill.mana}, have ${attacker.mana})`);

      // Apply skill
      attacker.mana -= skill.mana;
      let log = `*${attacker.name}* used *${skill.name}*!\n`;
      
      if (skill.dmg > 0) {
        const dmg = Math.floor(skill.dmg * (1 + (attacker.level * 0.05)));
        defender.hp = Math.max(0, defender.hp - dmg);
        log += `💥 Dealt *${dmg}* damage to ${defender.name}!\n`;
      } else if (skill.dmg < 0) {
        const heal = Math.abs(skill.dmg);
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
        log += `💚 Restored *${heal}* HP!\n`;
      }

      // Check for win
      if (defender.hp <= 0) {
        battle.status = 'finished';
        battle.winner = attacker.name;
        battle.loser = defender.name;
        await battle.save();
        return await handleWin(sock, jid, m, battle, isP1 ? sender : battle.player2Id, isP1 ? battle.player2Id : sender);
      }

      // Switch turn
      battle.turn = isP1 ? battle.player2Id : battle.player1Id;
      battle.round += 1;
      await battle.save();

      // If PvE, trigger bot turn
      if (battle.isPvE && battle.turn === 'BOT_OPPONENT') {
        return await handleBotTurn(sock, jid, m, battle, log);
      }

      // Send update
      return await sendBattleUpdate(sock, jid, m, battle, log);

    } catch (err) {
      console.error('[USE CMD ERROR]', err);
      return reply('❌ Battle error. Please try again.');
    }
  }
});

async function handleBotTurn(sock, jid, m, battle, prevLog) {
  const bot = battle.player2Data;
  const player = battle.player1Data;
  
  // Bot logic: simple random skill
  const botSkills = ['Fireball', 'Slash', 'Heal', 'Heavy Strike'];
  const skillName = botSkills[Math.floor(Math.random() * botSkills.length)];
  const skill = SKILLS.find(s => s.name === skillName);
  
  let log = prevLog + `\n🤖 *Bot's Turn:*\n`;
  bot.mana = Math.min(bot.maxMana, bot.mana + 10); // Bot mana regen
  
  if (bot.mana >= skill.mana) {
    bot.mana -= skill.mana;
    if (skill.dmg > 0) {
      const dmg = Math.floor(skill.dmg * (1 + (bot.level * 0.05)));
      player.hp = Math.max(0, player.hp - dmg);
      log += `🤖 Bot used *${skill.name}* and dealt *${dmg}* damage!\n`;
    } else {
      const heal = Math.abs(skill.dmg);
      bot.hp = Math.min(bot.maxHp, bot.hp + heal);
      log += `🤖 Bot used *${skill.name}* and healed *${heal}* HP!\n`;
    }
  } else {
    log += `🤖 Bot rested to recover mana.\n`;
  }

  if (player.hp <= 0) {
    battle.status = 'finished';
    battle.winner = 'Bot';
    battle.loser = player.name;
    await battle.save();
    return await handleWin(sock, jid, m, battle, 'BOT_OPPONENT', battle.player1Id);
  }

  battle.turn = battle.player1Id;
  battle.round += 1;
  await battle.save();

  return await sendBattleUpdate(sock, jid, m, battle, log);
}

async function sendBattleUpdate(sock, jid, m, battle, log) {
  let p1Av = null, p2Av = null;
  try { p1Av = await sock.profilePictureUrl(battle.player1Id, 'image'); } catch {}
  try { if (!battle.isPvE) p2Av = await sock.profilePictureUrl(battle.player2Id, 'image'); } catch {}

  const img = await generateBattleCard(
    { ...battle.player1Data, avatarUrl: p1Av },
    { ...battle.player2Data, avatarUrl: p2Av || 'https://files.catbox.moe/qxd31v.jpg' },
    battle.round,
    battle.turn === 'BOT_OPPONENT' ? 'Bot' : (battle.turn === battle.player1Id ? battle.player1Data.name : battle.player2Data.name)
  );

  return await sock.sendMessage(jid, {
    image: img,
    caption: `⚔️ *BATTLE UPDATE* ⚔️\n\n${log}\nRound ${battle.round}\nIt is *${battle.turn === 'BOT_OPPONENT' ? 'Bot' : (battle.turn === battle.player1Id ? battle.player1Data.name : battle.player2Data.name)}'s* turn!`
  }, { quoted: m });
}

async function handleWin(sock, jid, m, battle, winnerId, loserId) {
  const isBotWinner = winnerId === 'BOT_OPPONENT';
  const isBotLoser = loserId === 'BOT_OPPONENT';
  
  const xpGain = 50 + (battle.round * 5);
  const goldGain = 100 + (battle.round * 10);

  let resultData = {
    name: isBotWinner ? 'Bot' : battle.player1Data.name,
    xpEarned: xpGain,
    goldEarned: goldGain,
    newLevel: null,
  };

  if (!isBotWinner) {
    const winner = await LegacyPlayer.findOne({ whatsappId: winnerId });
    winner.wins += 1;
    winner.xp += xpGain;
    winner.gold += goldGain;
    
    // Check level up
    if (winner.xp >= winner.xpToNext) {
      winner.level += 1;
      winner.xp = 0;
      winner.xpToNext = Math.floor(winner.xpToNext * 1.2);
      resultData.newLevel = winner.level;
      
      // Unlock new skill every 5 levels
      if (winner.level % 5 === 0) {
        const newSkill = SKILLS.find(s => !winner.skills.includes(s.name));
        if (newSkill) winner.skills.push(newSkill.name);
      }
    }

    // RGP Stage progression
    if (battle.isPvE) {
      winner.stageProgress += 25;
      if (winner.stageProgress >= 100) {
        winner.stage += 1;
        winner.stageProgress = 0;
      }
    }
    
    await winner.save();
    resultData.name = winner.name;
    resultData.level = winner.level;
    resultData.wins = winner.wins;
    resultData.losses = winner.losses;
    resultData.stage = winner.stage;
    resultData.stageProgress = winner.stageProgress;
  }

  if (!isBotLoser && loserId !== 'BOT_OPPONENT') {
    const loser = await LegacyPlayer.findOne({ whatsappId: loserId });
    loser.losses += 1;
    await loser.save();
  }

  let winnerAv = null;
  try { if (!isBotWinner) winnerAv = await sock.profilePictureUrl(winnerId, 'image'); } catch {}

  const img = await generateResultCard(isBotWinner ? 'defeat' : 'victory', { ...resultData, avatarUrl: winnerAv });

  return await sock.sendMessage(jid, {
    image: img,
    caption: isBotWinner 
      ? `💀 *DEFEAT!* The Guardian was too strong.\nTry again after leveling up!`
      : `🏆 *VICTORY!* ${resultData.name} won the battle!\n\n✨ XP: +${xpGain}\n💰 Gold: +${goldGain}${resultData.newLevel ? `\n🎉 LEVEL UP: ${resultData.newLevel}!` : ''}`
  }, { quoted: m });
}
