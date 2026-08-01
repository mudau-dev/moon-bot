// commands/admins/gstatus.js
// ─────────────────────────────────────────────────────────────────────────────
// .gstatus — Group Status Detection Commands
// .gstatus del on/off — Auto-delete status shares
// .gstatus warn [count] — Set warn count then kick
// .Cadmin — Check if bot is admin in the group
// ─────────────────────────────────────────────────────────────────────────────

const { updateGstatus, getGroup } = require('../../models/athers/GroupSettings');
const { isBotAdmin } = require('../../handlers/Admin');

// ─────────────────────────────────────────────────────────────────────────────
// .gstatus — Toggle gstatus detection on/off
// ─────────────────────────────────────────────────────────────────────────────
moon({
  name: 'gstatus',
  category: 'admin',
  description: 'Manage group status detection. Detects when users share their WhatsApp status in the group.',
  usage: '.gstatus on | .gstatus off | .gstatus del on/off | .gstatus warn <count>',
  botv: true,  // requires bot to be admin
  roles: ['Mod', 'Owner', 'True Owner', 'CDC'],
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith('@g.us')) return reply('❌ This command can only be used in groups.');

      const sub = (args[0] || '').toLowerCase();
      const val = (args[1] || '').toLowerCase();

      // ── .gstatus on / off ──────────────────────────────────────────────
      if (sub === 'on' || sub === 'off') {
        const enabled = sub === 'on';
        updateGstatus(jid, { enabled });
        return reply(
          enabled
            ? `✅ *Group Status Detection: ON*\n> The bot will now detect and warn users who share their WhatsApp status in this group.`
            : `❌ *Group Status Detection: OFF*\n> Status detection has been disabled.`
        );
      }

      // ── .gstatus del on / off ──────────────────────────────────────────
      if (sub === 'del') {
        if (val !== 'on' && val !== 'off') {
          return reply('❌ Usage: `.gstatus del on` or `.gstatus del off`');
        }
        const deleteMsg = val === 'on';
        updateGstatus(jid, { deleteMsg });
        return reply(
          deleteMsg
            ? `✅ *Auto-Delete Status Shares: ON*\n> Status-share messages will be automatically deleted.`
            : `❌ *Auto-Delete Status Shares: OFF*\n> Status-share messages will not be deleted.`
        );
      }

      // ── .gstatus warn [count] ──────────────────────────────────────────
      if (sub === 'warn') {
        if (!val) {
          // Toggle warn system on/off
          const group = getGroup(jid);
          const current = group.gstatus?.warnEnabled ?? false;
          updateGstatus(jid, { warnEnabled: !current });
          return reply(
            !current
              ? `✅ *Warn System: ON*\n> Users will be warned when they share status. Use \`.gstatus warn <count>\` to set the kick threshold.`
              : `❌ *Warn System: OFF*\n> The warn system has been disabled.`
          );
        }

        const count = parseInt(val);
        if (isNaN(count) || count < 1 || count > 20) {
          return reply('❌ Warn count must be a number between 1 and 20.\nUsage: `.gstatus warn 3`');
        }

        updateGstatus(jid, { warnEnabled: true, warnLimit: count });
        return reply(
          `✅ *Warn System: ON*\n` +
          `⚠️ *Kick after:* ${count} warning(s)\n` +
          `> Users who share their status will be warned. After *${count}* warning(s), they will be removed from the group.`
        );
      }

      // ── .gstatus (no args) — show current settings ─────────────────────
      const group = getGroup(jid);
      const gs = group.gstatus || {};
      return reply(
        `📊 *GROUP STATUS DETECTION SETTINGS*\n` +
        `─────────────────────────\n` +
        `🔍 *Detection:* ${gs.enabled ? '✅ ON' : '❌ OFF'}\n` +
        `🗑️ *Auto-Delete:* ${gs.deleteMsg ? '✅ ON' : '❌ OFF'}\n` +
        `⚠️ *Warn System:* ${gs.warnEnabled ? '✅ ON' : '❌ OFF'}\n` +
        `🔢 *Warn Limit:* ${gs.warnLimit || 3} (then kick)\n` +
        `─────────────────────────\n` +
        `*Commands:*\n` +
        `• \`.gstatus on/off\` — Toggle detection\n` +
        `• \`.gstatus del on/off\` — Auto-delete status shares\n` +
        `• \`.gstatus warn <count>\` — Set warn limit (then kick)\n` +
        `• \`.gstatus warn\` — Toggle warn system on/off`
      );
    } catch (err) {
      console.error('[GSTATUS CMD ERROR]', err);
      return reply('❌ Error: ' + err.message);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// .Cadmin — Check if bot is admin in the current group
// ─────────────────────────────────────────────────────────────────────────────
moon({
  name: 'Cadmin',
  aliases: ['cadmin', 'checkadmin', 'botadmin'],
  category: 'admin',
  description: 'Check if the bot is an admin in this group.',
  usage: '.Cadmin',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith('@g.us')) {
        return reply('❌ This command can only be used in groups.');
      }

      const botNumber = sock.user?.id ? sock.user.id.split(':')[0] : 'Unknown';
      const admin = await isBotAdmin(sock, jid);

      if (admin) {
        return reply(
          `✅ *Yes* — I am an admin in this group.\n` +
          `🤖 *Bot Number:* ${botNumber}\n` +
          `> All admin-required commands will work properly.`
        );
      } else {
        return reply(
          `❌ *No* — I am NOT an admin in this group.\n` +
          `🤖 *Bot Number:* ${botNumber}\n` +
          `> Please promote me to admin so I can use admin commands (kick, delete, etc.).`
        );
      }
    } catch (err) {
      console.error('[CADMIN ERROR]', err);
      return reply('❌ Error checking admin status: ' + err.message);
    }
  }
});
