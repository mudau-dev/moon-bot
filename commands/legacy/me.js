/**
 * commands/legacy/me.js
 * .me — Generate and display the player's Legacy profile card.
 */
const LegacyPlayer = require('../../models/LegacyPlayer');
const { generateLegacyProfileCard } = require('../../utils/legacyImageGen');

moon({
  name: 'me',
  aliases: ['profile', 'lprofile'],
  category: 'legacy',
  description: 'Display your Moonlight Legacy profile card',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const player = await LegacyPlayer.findOne({ whatsappId: sender }).lean();
      if (!player) {
        return reply(
          '❌ You don\'t have a Legacy account yet.\n' +
          'Use *.genesis* to create your permanent account.'
        );
      }

      // Try to get WhatsApp profile picture
      let avatarUrl = null;
      try {
        avatarUrl = await sock.profilePictureUrl(sender, 'image');
      } catch { /* no avatar */ }

      // Generate profile card image
      const imgBuffer = await generateLegacyProfileCard(player, avatarUrl);

      const skillList = player.skills && player.skills.length
        ? player.skills.join(', ')
        : 'None yet — use *.choose* to pick a class';

      const xpNeeded = player.xpToNext - player.xp;
      const objective = getStageObjective(player.stage);

      // Send image and text combined
      await sock.sendMessage(jid, {
        image: imgBuffer,
        caption: 
          `⚔️ *${player.name}'s Legacy Profile*\n\n` +
          `🎯 *Current Objective:* ${objective}\n` +
          `✨ *XP to Next Level:* ${xpNeeded} XP needed\n` +
          `⚡ *Unlocked Skills:* ${skillList}\n` +
          `📍 *Stage ${player.stage} Progress:* ${player.stageProgress}%\n\n` +
          `> Use \`.skills\` to see full skill details.\n` +
          `> Use \`.status\` for detailed combat stats.`
      }, { quoted: m });

    } catch (err) {
      console.error('[ME CMD ERROR]', err);
      return reply('❌ Error generating your profile card. Please try again.');
    }
  },
});

function getStageObjective(stage) {
  const objectives = {
    1: 'Win 1 Duel',
    2: 'Reach Level 5',
    3: 'Learn your 4th skill',
    4: 'Win 3 PvP battles',
    5: 'Defeat a Warrior',
    6: 'Reach Level 10',
    7: 'Complete 5 quests',
    8: 'Win 10 duels total',
    9: 'Reach Level 15',
    10: 'Defeat a Mage',
    11: 'Earn 5,000 Gold',
    12: 'Reach Level 20',
    13: 'Win 20 duels total',
    14: 'Reach Level 25',
    15: 'Defeat a Paladin',
    16: 'Reach Level 30',
    17: 'Win 30 duels total',
    18: 'Reach Level 35',
    19: 'Complete 20 quests',
    20: 'Reach Level 40',
    21: 'Win 50 duels total',
    22: 'Reach Level 50',
    23: 'Earn 50,000 Gold',
    24: 'Reach Level 60',
    25: 'Win 75 duels total',
    26: 'Reach Level 70',
    27: 'Win 100 duels total',
    28: 'Reach Level 80',
    29: 'Reach Level 90',
    30: 'The Final Emperor Trial — Reach Level 100',
  };
  return objectives[stage] || `Stage ${stage} — Keep progressing!`;
}
