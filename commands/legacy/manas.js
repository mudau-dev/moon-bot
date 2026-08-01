const LegacyPlayer = require('../../models/LegacyPlayer');

/**
 * Helper: find a LegacyPlayer by sender.
 * genesis creates the record with whatsappId = moonId (phone number),
 * but the bot passes the full JID (number@s.whatsapp.net).
 * So we try both.
 */
async function findLegacyPlayer(sender) {
  const userNumber = sender.split('@')[0];
  return LegacyPlayer.findOne({
    $or: [
      { whatsappId: sender },
      { whatsappId: userNumber },
    ]
  });
}

// .mana — View your current mana
moon({
  name: 'mana',
  aliases: ['mp', 'manas'],
  category: 'legacy',
  description: 'View your current mana',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const player = await findLegacyPlayer(sender);
      if (!player)
        return reply('❌ You do not have a Legacy account. Use *.genesis*.');

      const currentMana = player.mana || 0;
      const maxMana = player.maxMana || 100;
      const pct = Math.min(100, Math.round((currentMana / maxMana) * 100));
      const barLen = 20;
      const filled = Math.round((pct / 100) * barLen);
      const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

      return reply(
        `🌙 *MANA STATUS*\n` +
        `─────────────『❀』\n` +
        `💧 *Current Mana:* ${currentMana.toLocaleString()}\n` +
        `💎 *Max Mana:* ${maxMana.toLocaleString()}\n` +
        `[${bar}] ${pct}%\n` +
        `─────────────『❀』\n` +
        `> Use the website shop to buy *Manas (x100)* to refill.`
      );
    } catch (err) {
      console.error('[MANA ERROR]', err);
      return reply('❌ Failed to load your mana.');
    }
  }
});

// .addmana — Admin command to manually add mana to a user
moon({
  name: 'addmana',
  category: 'legacy',
  description: 'Add mana to a user (Owners/Mods only)',
  roles: ['Mod', 'Owner', 'True Owner', 'CDC'],
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const target = mentioned || sender;
      const amountArg = mentioned ? args[1] : args[0];
      const amount = parseInt(amountArg) || 0;

      if (amount <= 0) {
        return reply('❌ Usage: `.addmana @user <amount>` or `.addmana <amount>`');
      }

      const targetNumber = target.split('@')[0];
      const player = await LegacyPlayer.findOne({
        $or: [
          { whatsappId: target },
          { whatsappId: targetNumber },
        ]
      });

      if (!player) return reply(`❌ @${targetNumber} does not have a Legacy account.`);

      player.mana = Math.min(player.maxMana, (player.mana || 0) + amount);
      await player.save();

      return await sock.sendMessage(jid, {
        text:
          `✅ *Mana Added*\n` +
          `👤 @${targetNumber}\n` +
          `💧 +${amount} mana\n` +
          `💎 New total: ${player.mana.toLocaleString()}`,
        mentions: [target]
      }, { quoted: m });
    } catch (err) {
      console.error('[ADDMANA ERROR]', err);
      return reply('❌ Failed to add mana.');
    }
  }
});
