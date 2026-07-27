const Group = require('../../models/athers/Group');
const User = require('../../models/User');

moon({
  name: "gambling",
  category: "owner",
  roles: ["True Owner"],

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      // =========================
      // TRUE OWNER CHECK ONLY
      // =========================

      const action = (args[0] || '').toLowerCase();

      if (!jid.endsWith('@g.us')) {
        return reply("❌ This command only works in groups.");
      }

      let group = await Group.findOne({ groupId: jid });

      if (!group) {
        group = await Group.create({ groupId: jid, gamblingEnabled: false });
      }

      // =========================
      // ENABLE
      // =========================
      if (action === "on") {

        if (group.gamblingEnabled === true) {
          return reply("⚠️ Gambling is already enabled in this group.");
        }

        group.gamblingEnabled = true;
        await group.save();

        return reply("✅ Gambling enabled.");
      }

      // =========================
      // DISABLE
      // =========================
      if (action === "off") {

        if (group.gamblingEnabled === false) {
          return reply("⚠️ Gambling is already disabled in this group.");
        }

        group.gamblingEnabled = false;
        await group.save();

        return reply("🚫 Gambling disabled.");
      }

      return reply("Usage: .gambling on / off");

    } catch (err) {
      console.error(err);
      return reply("❌ You don't have permission to do that");
    }
  }
});