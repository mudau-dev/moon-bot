const config = require('../../config');

moon({
  name: "setgdesc",
  category: "group",
  description: "Set group description",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      if (!jid.endsWith("@g.us")) {
        return reply("❌ Group only.");
      }

      const meta = await sock.groupMetadata(jid);

      // ---------------- USER ADMIN CHECK ----------------
      const user = meta.participants.find(p => p.id === sender);

      const isUserAdmin =
        user?.admin === "admin" ||
        user?.admin === "superadmin";

      if (!isUserAdmin) {
        return reply("❌ Only group admins can use this.");
      }

      // ---------------- BOT ADMIN CHECK ----------------
      const botJid = config.BOT_JID;

      const bot = meta.participants.find(p => p.id === botJid);

      const isBotAdmin =
        bot?.admin === "admin" ||
        bot?.admin === "superadmin";

      if (!isBotAdmin) {
        return reply("❌ Bot must be admin.");
      }

      // ---------------- DESCRIPTION ----------------
      const desc = args.join(" ").trim();

      if (!desc) {
        return reply("❌ Usage: .setgdesc <description>");
      }

      await sock.groupUpdateDescription(jid, desc);

      return reply("✅ Group description updated.");

    } catch (err) {
      console.error("setgdesc error:", err);
      return reply("❌ Failed to update group description.");
    }
  }
});