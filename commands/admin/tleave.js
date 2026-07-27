const GroupSettings = require("../../models/athers/GroupSettings");
const config = require("../../config");

moon({
  name: "tleave",
  category: "group",
  async execute(sock, jid, sender, args, m, { reply }) {
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
        return reply("❌ I need to be a group admin to manage leave messages.");
      }

      const sub = args[0]?.toLowerCase();

      if (sub === "on") {
        GroupSettings.updateGroup(jid, { leaveEnabled: true });
        return reply("✅ Leave messages *enabled* for this group.");
      }

      if (sub === "off") {
        GroupSettings.updateGroup(jid, { leaveEnabled: false });
        return reply("❌ Leave messages *disabled* for this group.");
      }

      if (sub === "set") {
        const msg = args.slice(1).join(" ");
        if (!msg) {
          return reply(
            "❌ Please provide a leave message.\n" +
            "Placeholders: @user @gname @count\n" +
            "Example: .tleave set Goodbye @user from @gname 😢"
          );
        }
        GroupSettings.updateGroup(jid, { leaveMessage: msg });
        return reply("✅ Leave message updated!");
      }

      // ── Show current settings ─────────────────────────────
      const group = GroupSettings.getGroup(jid);
      return reply(
        `*Leave Settings*\n` +
        `Status: ${group.leaveEnabled ? "✅ Enabled" : "❌ Disabled"}\n` +
        `Message: ${group.leaveMessage}\n\n` +
        `*Commands:*\n` +
        `.tleave on\n` +
        `.tleave off\n` +
        `.tleave set <message>\n\n` +
        `*Placeholders:* @user @gname @count`
      );

    } catch (err) {
      console.error("[TLEAVE ERROR]", err);
      return reply(`❌ Error: ${err.message}`);
    }
  }
});
