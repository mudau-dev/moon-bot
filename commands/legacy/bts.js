/**
 * commands/legacy/bts.js
 * .bts on/off
 * Enable or disable Legacy battles in this group.
 * Only the Bot True Owner can use this command.
 */

const Group = require('../../models/athers/Group');

moon({
  name: "bts",
  category: "legacy",
  roles: ["True Owner"],
  description: "Enable or disable Legacy battles in this group",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      // Group only
      if (!jid.endsWith("@g.us")) {
        return reply("❌ This command can only be used in groups.");
      }

      const action = (args[0] || "").toLowerCase();

      if (!["on", "off"].includes(action)) {
        return reply(
          `⚔️ *Legacy Battle Toggle*\n\n` +
          `Usage:\n` +
          `• *.bts on*\n` +
          `• *.bts off*\n\n` +
          `Default: *OFF*`
        );
      }

      let group = await Group.findOne({ groupId: jid });

      if (!group) {
        group = new Group({
          groupId: jid,
          legacyBattlesEnabled: false
        });
      }

      if (action === "on") {
        if (group.legacyBattlesEnabled) {
          return reply("⚠️ Legacy battles are already enabled in this group.");
        }

        group.legacyBattlesEnabled = true;
        await group.save();

        return reply(
          `✅ *Legacy Battles Enabled!*\n\n` +
          `⚔️ Players can now use *.duelreq @user* in this group.\n\n` +
          `> Use *.bts off* to disable them.`
        );
      }

      if (!group.legacyBattlesEnabled) {
        return reply("⚠️ Legacy battles are already disabled in this group.");
      }

      group.legacyBattlesEnabled = false;
      await group.save();

      return reply(
        `🚫 *Legacy Battles Disabled!*\n\n` +
        `Players can no longer start Legacy PvP battles in this group.\n\n` +
        `> Use *.bts on* to enable them again.`
      );

    } catch (err) {
      console.error("[BTS CMD ERROR]", err);
      return reply("❌ An unexpected error occurred while updating Legacy battles.");
    }
  }
});