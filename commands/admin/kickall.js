const User = require('../../models/User');

moon({
  name: "kickall",
  category: "group",
  description: "Kick all non-admin members and leave",

  async execute(sock, jid, sender, args, m, { reply, findOrCreateWhatsApp }) {
    try {

      if (!jid.endsWith("@g.us")) {
        return reply("❌ Group only.");
      }

      // ---------------- OWNER / ADMIN CHECK ----------------
      const senderUser = await findOrCreateWhatsApp(sender, sender.split("@")[0]);

      const allowed =
        senderUser?.role === "True Owner" ||
        senderUser?.role === "Owner";

      if (!allowed) {
        // fallback: allow group admins too
        const meta = await sock.groupMetadata(jid);
        const participant = meta.participants.find(p => p.id === sender);

        const isAdmin =
          participant?.admin === "admin" ||
          participant?.admin === "superadmin";

        if (!isAdmin) {
          return reply("❌ Only group admins can use this.baka.");
        }
      }

      // ---------------- GET GROUP DATA ----------------
      const meta = await sock.groupMetadata(jid);

      const botJid = sock.user.id;

      const targets = meta.participants
        .filter(p =>
          p.id !== botJid &&
          p.admin !== "admin" &&
          p.admin !== "superadmin"
        )
        .map(p => p.id);

      if (!targets.length) {
        await reply("⚠️ No non-admin members found.");
        await sock.groupLeave(jid);
        return;
      }

      // ---------------- KICK ALL ----------------
      await sock.sendMessage(jid, {
        text: `⚠️ Removing ${targets.length} users...`
      });

      await sock.groupParticipantsUpdate(jid, targets, "remove");

      // small delay before leaving
      setTimeout(async () => {
        try {
          await sock.groupLeave(jid);
        } catch (e) {
          console.error("Leave failed:", e);
        }
      }, 2000);

      return;

    } catch (err) {
      console.error("kickall error:", err);
      return reply("❌ Failed to execute kickall.");
    }
  }
});