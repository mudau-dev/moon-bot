moon({
  name: "tagadmins",
  category: "group",
  description: "Tag all group admins",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      if (!jid.endsWith("@g.us")) {
        return reply("❌ Group only.");
      }

      const meta = await sock.groupMetadata(jid);

      const botJid = sock.user.id;

      const admins = meta.participants
        .filter(p =>
          (p.admin === "admin" || p.admin === "superadmin") &&
          p.id !== botJid
        )
        .map(p => p.id);

      if (!admins.length) {
        return reply("❌ No admins found.");
      }

      return sock.sendMessage(jid, {
        text: `📢 *GROUP ADMINS TAG*\n\n${admins.map(() => "@admin").join("\n")}`,
        mentions: admins
      }, { quoted: m });

    } catch (err) {
      console.error("tagadmins error:", err);
      return reply("❌ Failed to tag admins.");
    }
  }
});