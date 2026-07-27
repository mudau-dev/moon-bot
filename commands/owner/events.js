const Group = require("../../models/athers/Group");

moon({
  name: "events",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Enable or disable event commands in the current group",

  async execute(sock, jid, sender, args, m, { reply, findOrCreateWhatsApp }) {
    try {
      // Must be used in a group
      if (!jid.endsWith("@g.us")) {
        return reply("❌ This command can only be used in a group.");
      }

      // Double-check owner role
      const user = await findOrCreateWhatsApp(sender, sender.split("@")[0]);
      const allowed = ["Owner", "True Owner", "Mod"];
      if (!user || !allowed.includes(user.role)) {
        return reply("❌ You don't have permission to use this command.");
      }

      const sub = (args[0] || "").toLowerCase();

      if (sub !== "on" && sub !== "off") {
        // Show current status
        const group = await Group.findOne({ groupId: jid });
        const status = group?.eventEnabled ? "✅ ON" : "❌ OFF";

        return reply(
`⚙️ *Event System Status*

Current status: *${status}*

Usage:
• *.events on* — enable event commands in this group
• *.events off* — disable event commands in this group

> When enabled, commands like *.mg*, *.challenge*, *.start*, and *.elb* will work here.`
        );
      }

      const enable = sub === "on";

      // Find or create group record
      let group = await Group.findOne({ groupId: jid });
      if (!group) {
        group = new Group({ groupId: jid });
      }

      group.eventEnabled = enable;
      await group.save();

      if (enable) {
        return reply(
`✅ *Event commands are now ENABLED in this group!*

Players can now use:
• *.start* — begin their journey
• *.mg* — view challenge levels
• *.challenge start <lv>* — start a challenge
• *.elb* — view the leaderboard
• *.mtime* — check round timer

> 🌙 The Moonlight Festival has begun!`
        );
      } else {
        return reply(
`❌ *Event commands are now DISABLED in this group.*

Players will be directed to use *.egc* to find the event group.`
        );
      }

    } catch (err) {
      console.error("EVENTS TOGGLE ERROR:", err);
      return reply("❌ Error updating event settings.");
    }
  }
});
