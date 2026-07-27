const User = require("../../models/User");

moon({
  name: "pssd",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Set True Owner via password",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      const password = args[0];
      const MASTER_PASSWORD = "Moonlight.haven.bots";

      // ---------------- PASSWORD CHECK ----------------
      if (!password) {
        return reply("❌ Provide password.");
      }

      if (password !== MASTER_PASSWORD) {
        return reply("❌ Wrong password.");
      }

      // ---------------- DELETE COMMAND MESSAGE ----------------
      try {
        await sock.sendMessage(jid, {
          delete: m.key
        });
      } catch (e) {
        console.log("Delete failed:", e.message);
      }

      // ---------------- FIND USER ----------------
      let user = await User.findOne({
        userId: sender
      });

      if (!user) {
        user = new User({
          userId: sender,
          username: m.pushName || "Unknown",
          role: "Owner"
        });
      } else {
        user.role = "Owner";
      }

      await user.save();

      // ---------------- CONFIRMATION ----------------
      await sock.sendMessage(jid, {
        text:
`👑 *Access granted.*
you haven bean \`verified as Owner.\``
      });

    } catch (err) {
      console.error("pssd error:", err.message);
      return reply("❌ Failed to set owner.");
    }
  }
});

