const config = require('../../config');

moon({
  name: "admincheck",
  category: "group",
  description: "Check if user and bot are admins",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid || !jid.endsWith("@g.us")) {
        return reply("❌ This command only works in groups.");
      }

      const metadata = await sock.groupMetadata(jid);

      // ---------------- USER CHECK ----------------
      const userParticipant = metadata.participants.find(p => p.id === sender);

      const isUserAdmin =
        userParticipant?.admin === "admin" ||
        userParticipant?.admin === "superadmin";

      // ---------------- BOT CHECK ----------------
      const botJid = config.BOT_JID;

      const botParticipant = metadata.participants.find(p => p.id === botJid);

      const isBotAdmin =
        botParticipant?.admin === "admin" ||
        botParticipant?.admin === "superadmin";

      // ---------------- RESPONSE ----------------
      let text = `🔍 *Admin Check*\n\n`;

      text += `👤 *User:* ${isUserAdmin ? "✅ Admin" : "❌ Not Admin"}\n`;
      text += `🤖 *Bot:* ${isBotAdmin ? "✅ Admin" : "❌ Not Admin"}\n`;

      return reply(text);

    } catch (err) {
      console.error("admincheck error:", err);
      return reply("❌ Failed to check admin status.");
    }
  }
});