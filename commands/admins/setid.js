const User = require('../../models/User');

// .setid — Change a user's Moon ID (Owners and Mods only)
// Usage:
//   .setid @user newid   → sets @user's moonId to "newid"
//   .setid @user         → sets @user's moonId to their phone number
//   .setid               → sets your own moonId to your phone number
moon({
  name: 'setid',
  aliases: ['changeid'],
  category: 'admin',
  description: 'Change a user\'s Moon ID. (Owners/Mods only)',
  usage: '.setid [@user] [newid]',
  roles: ['Mod', 'Owner', 'True Owner', 'CDC'],
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const botId = sock.user?.id ? sock.user.id.split(':')[0] : "Unknown";

      // Resolve target: mentioned user OR replied-to user OR self
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
      const target = mentioned || quoted || sender;
      const targetNumber = target.split('@')[0];

      // Determine new ID
      // If args has content after the mention, use it; otherwise use target's phone number
      let newId;
      if (mentioned && args.length >= 2) {
        // .setid @user newid
        newId = args[1].trim();
      } else if (!mentioned && args.length >= 1) {
        // .setid newid (no mention)
        newId = args[0].trim();
      } else {
        // No new ID provided — use phone number
        newId = targetNumber;
      }

      // Validate new ID
      if (!newId || newId.length < 3) {
        return reply('❌ Invalid ID. Must be at least 3 characters.');
      }

      // Check if new ID is already taken by someone else
      const existing = await User.findOne({ moonId: newId });
      if (existing && existing.whatsappNumber !== target) {
        return reply(`❌ The ID \`${newId}\` is already in use by another user.`);
      }

      // Find target user
      let user = await User.findOne({
        $or: [
          { whatsappNumber: target },
          { userId: targetNumber },
          { moonId: targetNumber }
        ]
      });

      if (!user) {
        return reply(`❌ User @${targetNumber} is not registered.`);
      }

      const oldId = user.moonId || 'none';
      user.moonId = newId;
      await user.save();

      return await sock.sendMessage(jid, {
        text:
          `🌙 *MOONLIGHT HAVEN — ID UPDATED*\n` +
          `─────────────『❀』\n` +
          `👤 *User:* @${targetNumber}\n` +
          `🔄 *Old ID:* \`${oldId}\`\n` +
          `✅ *New ID:* \`${newId}\`\n` +
          `─────────────『❀』\n` +
          `> Updated by @${sender.split('@')[0]}`,
        mentions: [target, sender]
      }, { quoted: m });

    } catch (err) {
      console.error('[SETID ERROR]', err);
      return reply('❌ Failed to update the user ID.');
    }
  }
});
