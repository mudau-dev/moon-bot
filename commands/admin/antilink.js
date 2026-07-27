const { getGroup, updateGroup } = require("../../models/athers/GroupSettings");
const config = require("../../config");

moon({
  name: "antilink",
  category: "group",
  description: "Manage anti-link protection.",
  usage: ".antilink <on|off|warn|delete|kick>",
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
        return reply("❌ I need to be a group admin to enforce anti-link.");
      }

      const sub = args[0]?.toLowerCase();
      const group = getGroup(jid);

      if (!sub) {
        const status = group.antilink?.enabled ? "✅ Enabled" : "❌ Disabled";
        const action = group.antilink?.action || "warn";
        return reply(
          `📛 *Anti-Link Settings*\n` +
          `Status: ${status}\n` +
          `Action: ${action}\n\n` +
          `.antilink on\n` +
          `.antilink off\n` +
          `.antilink warn <number>\n` +
          `.antilink delete\n` +
          `.antilink kick`
        );
      }

      switch (sub) {
        case "on":
          updateGroup(jid, {
            antilink: { ...group.antilink, enabled: true }
          });
          return reply("✅ Anti-link *enabled*.");

        case "off":
          updateGroup(jid, {
            antilink: { ...group.antilink, enabled: false }
          });
          return reply("❌ Anti-link *disabled*.");

        case "warn": {
          const limit = parseInt(args[1]);
          if (!limit || limit < 1) return reply("❌ Usage: .antilink warn <number>\nExample: .antilink warn 3");
          updateGroup(jid, {
            antilink: {
              ...group.antilink,
              enabled: true,
              action: "warn",
              warnLimit: limit
            }
          });
          return reply(`⚠️ Anti-link set to *warn* after ${limit} violation(s).`);
        }

        case "delete":
          updateGroup(jid, {
            antilink: {
              ...group.antilink,
              enabled: true,
              action: "delete"
            }
          });
          return reply("🗑️ Anti-link set to *delete* messages.");

        case "kick":
          updateGroup(jid, {
            antilink: {
              ...group.antilink,
              enabled: true,
              action: "kick"
            }
          });
          return reply("🚫 Anti-link set to *kick* violators.");

        default:
          return reply("❌ Invalid option. Use: on | off | warn <n> | delete | kick");
      }

    } catch (err) {
      console.error("[ANTILINK ERROR]", err);
      return reply("❌ Error executing anti-link command.");
    }
  }
});
