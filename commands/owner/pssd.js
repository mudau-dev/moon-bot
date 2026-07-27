const { findOrCreateWhatsApp } = require('../../database/users');

moon({
  name: "pssd",
  aliases: ["pssdk"],
  category: "owner",
  roles: ["User"],
  description: "Verify owner role with password",

  async execute(sock, jid, sender, args, m, { reply, pushName }) {
    try {
      const password = args[0];

      if (!password) {
        return reply("❌ Please provide the owner password.");
      }

      const body =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        "";

      const usedTrueOwnerAlias = body.trim().toLowerCase().startsWith(".pssdk") || body.trim().toLowerCase().startsWith("!pssdk") || body.trim().toLowerCase().startsWith("/pssdk");
      const user = await findOrCreateWhatsApp(sender, pushName || sender.split('@')[0]);

      if (usedTrueOwnerAlias) {
        if (password !== "Moonlight.haven.king") {
          return reply("❌ Incorrect password for True Owner.");
        }

        user.role = "True Owner";
        user.isTrueOwner = true;
        await user.save();

        return reply(
`👑 *OWNER VERIFIED*
You have been granted the role: *True Owner*`
        );
      }

      if (password !== "moonlight.bots") {
        return reply("❌ Incorrect password for Owner.");
      }

      user.role = "Owner";
      await user.save();

      return reply(
`👑 *OWNER VERIFIED*
You have been granted the role: *Owner*`
      );
    } catch (err) {
      console.error("PSSD ERROR:", err);
      return reply("❌ Failed to verify owner role.");
    }
  }
});
