const config = require('../../config');

moon({
  name: "setgp",
  category: "group",
  description: "Set group icon (reply to image)",

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

      // ---------------- GET IMAGE FROM REPLY ----------------
      const ctx = m.message?.extendedTextMessage?.contextInfo;

      const quoted = ctx?.quotedMessage;

      const image =
        quoted?.imageMessage ||
        quoted?.viewOnceMessageV2?.message?.imageMessage;

      if (!image) {
        return reply("❌ Reply to an image.");
      }

      const stream = await sock.downloadContentFromMessage(image, "image");
      let buffer = Buffer.from([]);

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      await sock.updateProfilePicture(jid, buffer);

      return reply("✅ Group icon updated.");

    } catch (err) {
      console.error("setgp error:", err);
      return reply("❌ Failed to update group icon.");
    }
  }
});