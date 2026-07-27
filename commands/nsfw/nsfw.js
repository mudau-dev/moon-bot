const NSFWGroup = require('../../models/athers/NSFWGroup');

/**
 * Helper: check if sender is a group admin or bot owner/mod
 */
async function isGroupAdmin(sock, jid, sender) {
  try {
    const groupMeta = await sock.groupMetadata(jid);
    const admins = groupMeta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => p.id);
    return admins.includes(sender);
  } catch {
    return false;
  }
}

moon({
  name: 'nsfw',
  category: 'nsfw',
  description: 'Manage NSFW settings for this group',
  aliases: ['nsfwstatus'],
  subcommands: ['on', 'off'],
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const subCmd = (args[0] || '').toLowerCase();

      // ── .nsfw on ──────────────────────────────────────────────────────────
      if (subCmd === 'on') {
        if (!jid.endsWith('@g.us')) {
          return reply('❌ This command can only be used in groups.');
        }

        const isAdmin = await isGroupAdmin(sock, jid, sender);
        if (!isAdmin) {
          return reply(
`╔══════════════════╗
║   🔞 NSFW SYSTEM  ║
╚══════════════════╝

❌ *Only Group Admins* can enable NSFW commands.

Ask a group admin to run *.nsfw on*`
          );
        }

        await NSFWGroup.findOneAndUpdate(
          { groupId: jid },
          { groupId: jid, enabled: true, enabledBy: sender, enabledAt: new Date() },
          { upsert: true }
        );

        return reply(
`╔══════════════════╗
║   🔞 NSFW SYSTEM  ║
╚══════════════════╝

✅ *NSFW commands are now ENABLED*

⚠️ This group has unlocked adult content.
Use *.menu* to see all available NSFW commands.

_Disable at any time with *.nsfw off*_`
        );
      }

      // ── .nsfw off ─────────────────────────────────────────────────────────
      if (subCmd === 'off') {
        if (!jid.endsWith('@g.us')) {
          return reply('❌ This command can only be used in groups.');
        }

        const isAdmin = await isGroupAdmin(sock, jid, sender);
        if (!isAdmin) {
          return reply('❌ Only Group Admins can disable NSFW commands.');
        }

        await NSFWGroup.findOneAndUpdate(
          { groupId: jid },
          { groupId: jid, enabled: false },
          { upsert: true }
        );

        return reply(
`╔══════════════════╗
║   🔞 NSFW SYSTEM  ║
╚══════════════════╝

🚫 *NSFW commands are now DISABLED*

All adult content commands have been turned off for this group.`
        );
      }

      // ── .nsfw (status check) ──────────────────────────────────────────────
      if (!jid.endsWith('@g.us')) {
        return reply(
`╔══════════════════╗
║   🔞 NSFW SYSTEM  ║
╚══════════════════╝

ℹ️ NSFW commands are available in groups only.

Ask a group admin to enable with *.nsfw on*`
        );
      }

      const record = await NSFWGroup.findOne({ groupId: jid });
      const isEnabled = record?.enabled === true;

      return reply(
`╔══════════════════╗
║   🔞 NSFW SYSTEM  ║
╚══════════════════╝

📊 *Status:* ${isEnabled ? '🔞 ENABLED' : '🚫 DISABLED'}

${isEnabled
  ? '✅ NSFW commands are active in this group.\nUse *.nsfw off* to disable.'
  : '❌ NSFW commands are disabled.\nGroup admins can enable with *.nsfw on*'}`
      );

    } catch (err) {
      console.error('[NSFW CMD ERROR]', err);
      return reply('❌ Failed to update NSFW settings. Please try again.');
    }
  }
});
