const LegacyPlayer = require('../../models/LegacyPlayer');

moon({
  name: 'mana',
  aliases: ['mp'],
  category: 'legacy',
  description: 'View your current mana',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const player = await LegacyPlayer.findOne({ whatsappId: sender });

      if (!player)
        return reply('❌ You do not have a Legacy account. Use *.genesis*.');

      return reply(`> you have: *${player.mana}* manas`);
    } catch (err) {
      console.error(err);
      return reply('❌ Failed to load your mana.');
    }
  }
});