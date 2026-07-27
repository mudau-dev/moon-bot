const Bot = require('../../models/athers/Bot');
const GroupSettings = require('../../models/athers/GroupSettings');
const config = require('../../config');

moon({
  name: "mode",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Toggle bot mode (global or group-specific)",
  subcommands: ["on", "off", "g on", "g off"],
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const sub = (args[0] || "").toLowerCase();
      const botName = (config.BOT_NAME || "Rem").toLowerCase();

      // ── .mode on/off (Global Staff-Only Mode) ──
      if (sub === "on" || sub === "off") {
        const isStaffOnly = sub === "on";
        await Bot.findOneAndUpdate(
          { name: botName },
          { staffOnlyMode: isStaffOnly },
          { upsert: true }
        );
        return reply(`✅ *GLOBAL MODE UPDATED* ✅\n\nStaff-Only Mode: *${isStaffOnly ? "ON" : "OFF"}*\n${isStaffOnly ? "> The bot will now only respond to Owners and Mods." : "> The bot will now respond to all users."}`);
      }

      // ── .mode g on/off (Group-Specific Mode) ──
      if (sub === "g") {
        const toggle = (args[1] || "").toLowerCase();
        if (toggle !== "on" && toggle !== "off") {
          return reply("❌ Usage: `.mode g on/off` (Toggle bot functionality for this group)");
        }
        const isEnabled = toggle === "on";
        const group = GroupSettings.getGroup(jid);
        group.botEnabled = isEnabled;
        GroupSettings.updateGroup(jid, { botEnabled: isEnabled });
        return reply(`✅ *GROUP MODE UPDATED* ✅\n\nBot Enabled: *${isEnabled ? "ON" : "OFF"}*\n${isEnabled ? "> The bot is now active in this group." : "> The bot is now disabled in this group (except for Owners/Mods)."}`);
      }

      return reply("❌ Usage:\n`.mode on/off` (Global Staff Mode)\n`.mode g on/off` (Group Toggle)");
    } catch (err) {
      console.error("MODE CMD ERROR:", err);
      return reply("❌ Error updating mode.");
    }
  }
});
