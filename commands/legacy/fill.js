/**
 * commands/legacy/fill.js
 * .fill gender male/female  |  .fill age <number>
 */
const LegacyPlayer = require('../../models/LegacyPlayer');

moon({
  name: 'fill',
  category: 'legacy',
  description: 'Set your Legacy profile gender or age',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const player = await LegacyPlayer.findOne({ whatsappId: sender });
      if (!player) {
        return reply('❌ You don\'t have a Legacy account yet.\nUse \`.genesis\` to create one.');
      }

      const field = (args[0] || '').toLowerCase();
      const value = (args[1] || '').toLowerCase();

      if (field === 'gender') {
        if (value !== 'male' && value !== 'female') {
          return reply('Usage: \`.fill gender male\` or \`.fill gender female\`');
        }
        player.gender = value;
        if (player.age) player.isActive = true;
        await player.save();

        const title = value === 'male' ? 'Squire' : 'Squire';
        return reply(
          `✅ *Gender set to ${value.charAt(0).toUpperCase() + value.slice(1)}*\n\n` +
          `${player.age ? '✅ Profile is now active!' : '⚠️ Set your age with \`.fill age 18\` to activate your profile.'}`
        );
      }

      if (field === 'age') {
        const age = parseInt(value);
        if (isNaN(age) || age < 13 || age > 50) {
          return reply('Usage: \`.fill age 18\` (must be between 13 and 120)');
        }
        player.age = age;
        if (player.gender) player.isActive = true;
        await player.save();
        return reply(
          `✅ *Age set to ${age}*\n\n` +
          `${player.gender ? '✅ Profile is now active!' : '⚠️ Set your gender with *.fill gender male/female* to activate your profile.'}`
        );
      }

      return reply(
        `*Profile Setup Commands:*\n\n` +
        `• \`.fill gender male\`\n` +
        `• \`.fill gender female\`\n` +
        `• \`.fill age 18\``
      );
    } catch (err) {
      console.error('[FILL CMD ERROR]', err);
      return reply('❌ Error updating your profile. Please try again.');
    }
  },
});
