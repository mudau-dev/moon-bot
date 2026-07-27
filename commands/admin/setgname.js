const config = require('../../config');

moon({
  name: "setgname",
  category: "group",
  description: "Set group name",

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

      // ---------------- BOT ADMIN CHECK (BOT_JID) ----------------
      const botJid = config.BOT_JID;

      const bot = meta.participants.find(p => p.id === botJid);

      const isBotAdmin =
        bot?.admin === "admin" ||
        bot?.admin === "superadmin";

      if (!isBotAdmin) {
        return reply("❌ Bot must be admin to change group name.");
      }

      const name = args.join(" ").trim();

      if (!name) {
        return reply("❌ Usage: .setgname <new group name>");
      }

      await sock.groupUpdateSubject(jid, name);

      return reply(`✅ Group name updated:\n${name}`);

    } catch (err) {
      console.error("setgname error:", err);
      return reply("❌ Failed to update group name.");
    }
  }
});