const { getGroup, updateGroup } = require("../../models/athers/GroupSettings");
const config = require("../../config");

moon({
  name: "antibot",
  category: "group",
  description: "Enable or disable anti-bot protection (deletes suspicious bot messages).",
  usage: ".antibot <on|off>",

  async execute(sock, jid, sender, args, message, { reply }) {
    try {
      // ── Groups only ─────────────────────────────
      if (!jid.endsWith("@g.us")) {
        return reply("❌ This command only works in groups.");
      }

      const metadata = await sock.groupMetadata(jid);

      // ── Admin check ─────────────────────────────
      const senderParticipant = metadata.participants.find(p => p.id === sender);

      const isUserAdmin =
        senderParticipant?.admin === "admin" ||
        senderParticipant?.admin === "superadmin";

      if (!isUserAdmin) {
        return reply("❌ You must be a group admin to use this command.");
      }

      // ── Bot admin check ─────────────────────────
      const botJid = config.BOT_JID;

      const botParticipant = metadata.participants.find(p => p.id === botJid);

      const isBotAdmin =
        botParticipant?.admin === "admin" ||
        botParticipant?.admin === "superadmin";

      if (!isBotAdmin) {
        return reply("❌ I need admin rights to manage anti-bot protection.");
      }

      const sub = (args[0] || "").toLowerCase();
      const group = getGroup(jid);

      if (!sub) {
        const status = group.antibot?.enabled ? "✅ Enabled" : "❌ Disabled";

        return reply(
          `🤖 *Anti-Bot Settings*\n` +
          `Status: ${status}\n\n` +
          `ℹ️ When enabled, I will delete suspicious bot-like messages in this group.\n\n` +
          `.antibot on\n` +
          `.antibot off`
        );
      }

      switch (sub) {
        case "on":
          updateGroup(jid, {
            antibot: {
              ...(group.antibot || {}),
              enabled: true
            }
          });

          return reply(
            "✅ Anti-bot *enabled*.\n" +
            "Suspicious bot messages will now be deleted."
          );

        case "off":
          updateGroup(jid, {
            antibot: {
              ...(group.antibot || {}),
              enabled: false
            }
          });

          return reply("❌ Anti-bot *disabled*.");

        default:
          return reply("❌ Invalid option. Use *.antibot on* or *.antibot off*");
      }

    } catch (err) {
      console.error("[ANTIBOT ERROR]", err);
      return reply("❌ Error executing anti-bot command.");
    }
  }
});