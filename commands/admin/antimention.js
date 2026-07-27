const { getGroup, updateGroup } = require("../../models/athers/GroupSettings");
const config = require("../../config");

moon({
  name: "antimention",
  category: "group",
  description: "Manage anti-mention protection — deletes status mentions in groups.",
  usage: ".antimention <on|off>",
  async execute(sock, jid, sender, args, message, { reply }) {
    try {
      // ── Groups only ───────────────────────────────────────
      if (!jid.endsWith("@g.us")) {
        return reply("❌ This command only works in groups.");
      }

      const metadata = await sock.groupMetadata(jid);

      // ── Check if sender is admin ──────────────────────────
      const senderParticipant = metadata.participants.find(p => p.id === sender);
      const isUserAdmin =
        senderParticipant?.admin === "admin" ||
        senderParticipant?.admin === "superadmin";

      if (!isUserAdmin) {
        return reply("❌ You must be a group admin to use this command.");
      }

      // ── Check if bot is admin (using config.BOT_JID) ──────
      const botJid = config.BOT_JID;
      const botParticipant = metadata.participants.find(p => p.id === botJid);
      const isBotAdmin =
        botParticipant?.admin === "admin" ||
        botParticipant?.admin === "superadmin";

      if (!isBotAdmin) {
        return reply("❌ I need to be a group admin to delete status mention messages.");
      }

      const sub = args[0]?.toLowerCase();
      const group = getGroup(jid);

      if (!sub) {
        const status = group.antimention?.enabled ? "✅ Enabled" : "❌ Disabled";
        return reply(
          `📛 *Anti-Mention Settings*\n` +
          `Status: ${status}\n\n` +
          `ℹ️ When enabled, I will automatically delete messages that are status mentions (tagged from WhatsApp status) in this group.\n\n` +
          `.antimention on\n` +
          `.antimention off`
        );
      }

      switch (sub) {
        case "on":
          updateGroup(jid, {
            antimention: { ...group.antimention, enabled: true }
          });
          return reply(
            "✅ Anti-mention *enabled*.\n" +
            "I will now delete status mention messages in this group."
          );

        case "off":
          updateGroup(jid, {
            antimention: { ...group.antimention, enabled: false }
          });
          return reply("❌ Anti-mention *disabled*.");

        default:
          return reply("❌ Invalid option. Use: *.antimention on* or *.antimention off*");
      }

    } catch (err) {
      console.error("[ANTIMENTION ERROR]", err);
      return reply("❌ Error executing anti-mention command.");
    }
  }
});
