/**
 * commands/legacy/legacy.js
 * .legacy — Shows Moonlight Legacy game info, description, and join group link.
 */
const { generateLegacyInfoBanner } = require('../../utils/legacyImageGen');
const config = require('../../config');

const LEGACY_GROUP_LINK = config.RPG_LINK;

moon({
  name: 'legacy',
  category: 'legacy',
  description: 'Show Moonlight Legacy game info and join link',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      // Generate the info banner image
      const imgBuffer = await generateLegacyInfoBanner();

      const infoText =
        `╔═════════════════════╗\n` +
        `║   ⚔️  MOONLIGHT LEGACY ⚔️   ║\n` +
        `╚═════════════════════╝\n\n` +
        `*A Persistent Fantasy MMORPG*\n\n` +
        `Moonlight Legacy is an immersive turn-based RPG built exclusively for Moonlight. ` +
        `Every player has a permanent profile stored in the database — your progress never resets.\n\n` +
        `*🎮 Features:*\n` +
        `• 5 Unique Classes — Mage, Warrior, Assassin, Archer, Paladin\n` +
        `• Turn-based PvP duels with real skill strategy\n` +
        `• 30 Progression Stages with objectives\n` +
        `• Level 1 → 100 with stat growth\n` +
        `• Rank system: Commoner → Celestial Emperor/Empress\n` +
        `• Skills, cooldowns, status effects\n` +
        `• Economy: Gold, Market, Inventory\n` +
        `• Daily blessings, quests, achievements\n\n` +
        `*⚠️ Note:* Battles can only be played in the official Legacy group.\n\n` +
        `*📌 Commands to get started:*\n` +
        `• *.genesis* — Create your Legacy account\n` +
        `• *.fill gender male/female* — Set your gender\n` +
        `• *.fill age 18* — Set your age\n` +
        `• *.choose* — Pick your class\n` +
        `• *.me* — View your profile card\n` +
        `• *.helplegacy* — All Legacy commands\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🔗 *Join the Legacy Group:*\n` +
        `${LEGACY_GROUP_LINK}`;

      // Send the banner image first
      await sock.sendMessage(jid, {
        image: imgBuffer,
        caption: '⚔️ *MOONLIGHT LEGACY* — Tap the link below to join the battle group!\n ${LEGACY_GROUP_LINK}',
      }, { quoted: m });

      // Then send the full info text with the join button
      await sock.sendMessage(jid, {
        text: infoText,
        contextInfo: {
          externalAdReply: {
            title: '⚔️ Join Moonlight Legacy',
            body: 'The official battle group — tap to join!',
            mediaType: 1,
            sourceUrl: LEGACY_GROUP_LINK,
            renderLargerThumbnail: false,
          },
        },
      }, { quoted: m });

    } catch (err) {
      console.error('[LEGACY CMD ERROR]', err);
      return reply('❌ Error loading Legacy info. Please try again.');
    }
  },
});
