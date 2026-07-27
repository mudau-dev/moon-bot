/**
 * commands/legacy/challenge.js
 * .challenge start / .c start — Start a PvE battle against a bot to progress in RGP stages.
 */
const LegacyPlayer = require('../../models/LegacyPlayer');
const LegacyBattle = require('../../models/LegacyBattle');
const { generateBattleCard } = require('../../utils/legacyImageGen');
const { SKILLS } = require('../../utils/skillLibrary');

moon({
  name: 'challenge',
  aliases: ['c'],
  category: 'legacy',
  description: 'Challenge the bot to progress in RGP stages',
  async execute(sock, jid, sender, args, m, { reply, pushName }) {
    try {
      const sub = (args[0] || '').toLowerCase();
      if (sub !== 'start') {
        return reply('Usage: *.challenge start* or *.c start* to fight the bot for RGP progression.');
      }

      const player = await LegacyPlayer.findOne({ whatsappId: sender });
      if (!player) return reply('❌ No Legacy account. Use *.genesis* first.');
      if (!player.class) return reply('❌ Choose a class first with *.choose*.');

      // Check if already in a battle
      const active = await LegacyBattle.findOne({ 
        $or: [{ player1Id: sender }, { player2Id: sender }],
        status: 'active'
      });
      if (active) return reply('⚠️ You are already in a battle! Finish it first.');

      // Bot Stats based on Player Stage
      const stage = player.stage || 1;
      const botDifficulty = 0.8 + (stage * 0.1); // Gets harder per stage
      const botStats = {
        name: `Stage ${stage} Guardian`,
        whatsappId: 'BOT_OPPONENT',
        level: stage * 2,
        rank: 'Guardian',
        hp: Math.floor(100 * botDifficulty),
        maxHp: Math.floor(100 * botDifficulty),
        mana: Math.floor(100 * botDifficulty),
        maxMana: Math.floor(100 * botDifficulty),
        attack: Math.floor(15 * botDifficulty),
        defense: Math.floor(10 * botDifficulty),
        magic: Math.floor(10 * botDifficulty),
        speed: Math.floor(10 * botDifficulty),
        critRate: 5,
        class: 'Guardian',
        avatarUrl: 'https://files.catbox.moe/qxd31v.jpg', // Bot avatar
      };

      // Create Battle
      const battle = await LegacyBattle.create({
        player1Id: sender,
        player2Id: 'BOT_OPPONENT',
        player1Data: {
          name: player.name,
          hp: player.hp,
          maxHp: player.maxHp,
          mana: player.mana,
          maxMana: player.maxMana,
          level: player.level,
          rank: player.rank,
        },
        player2Data: botStats,
        turn: sender,
        round: 1,
        status: 'active',
        isPvE: true,
        stage: stage,
      });

      // Try to get player avatar
      let p1Avatar = null;
      try { p1Avatar = await sock.profilePictureUrl(sender, 'image'); } catch {}

      const img = await generateBattleCard(
        { ...battle.player1Data, avatarUrl: p1Avatar },
        botStats,
        1,
        player.name
      );

      return await sock.sendMessage(jid, {
        image: img,
        caption: `⚔️ *BATTLE START!* ⚔️\n\n` +
                 `👤 *${player.name}* (Lv.${player.level})\n` +
                 `      🆚\n` +
                 `🤖 *${botStats.name}* (Lv.${botStats.level})\n\n` +
                 `🎯 Stage: ${stage}\n` +
                 `It is your turn! Use *.use <skill>* to attack.`
      }, { quoted: m });

    } catch (err) {
      console.error('[CHALLENGE CMD ERROR]', err);
      return reply('❌ Error starting challenge. Please try again.');
    }
  },
});
