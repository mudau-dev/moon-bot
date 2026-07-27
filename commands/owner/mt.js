const Group = require('../../models/athers/Group');
const { findOrCreateWhatsApp } = require('../../database/users');

moon({
  name: 'mt',
  category: 'owner',
  roles: ["Mod", "Owner", "True Owner"],
  description: 'Enable or disable community mute system',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      // ── GROUP ONLY ─────────────────────────
      if (!jid.endsWith('@g.us')) {
        return reply('❌ This command only works in groups.');
      }

      // ── PERMISSION CHECK ───────────────────
      const owner = await findOrCreateWhatsApp(sender);

      const allowed =
        ['True Owner', 'Owner', 'Mod'].includes(owner?.role) ||
        owner?.isTrueOwner === true;

      if (!allowed) {
        return reply("❌ You can't use this command.");
      }

      // ── ARGUMENT ───────────────────────────
      const sub = (args[0] || '').toLowerCase();

      if (!['on', 'off'].includes(sub)) {
        return reply(
`📌 Usage:
.mt on
.mt off`
        );
      }

      // ── GET OR CREATE GROUP ────────────────
      let group = await Group.findOne({
        groupId: jid
      });

      if (!group) {
        group = await Group.create({
          groupId: jid,
          muteSystem: false
        });
      }

      // ── ENABLE ─────────────────────────────
      if (sub === 'on') {

        if (group.muteSystem === true) {
          return reply('⚠️ Community mute system already enabled.');
        }

        group.muteSystem = true;

        await group.save();

        return reply(
`✅ COMMUNITY MUTE ENABLED

🔇 .cmute users messages will now be deleted automatically in this group.`
        );
      }

      // ── DISABLE ────────────────────────────
      if (sub === 'off') {

        if (group.muteSystem === false) {
          return reply('⚠️ Community mute system already disabled.');
        }

        group.muteSystem = false;

        await group.save();

        return reply(
`🔊 COMMUNITY MUTE DISABLED

❌ Muted users messages will no longer be deleted in this group.`
        );
      }

    } catch (err) {

      console.error('MT CMD ERROR:', err);

      return reply('❌ Failed to update mute system.');
    }
  }
});