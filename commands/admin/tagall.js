const config = require('../../config');

moon({
  name: "tagall",
  category: "group",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      if (!jid.endsWith("@g.us")) {
        return reply("❌ Group only.");
      }

      const metadata = await sock.groupMetadata(jid);

      const user = metadata.participants.find(p => p.id === sender);
      if (!user || !user.admin) {
        return reply("❌ Admin only.");
      }

      const bot = metadata.participants.find(p => p.id === config.BOT_JID);
      if (!bot || !bot.admin) {
        return reply("❌ Bot must be admin.");
      }

      const members = metadata.participants.map(p => p.id);

      // message source
      let message = args.join(" ");
      if (!message && m.quoted) {
        message =
          m.quoted.text ||
          m.quoted.conversation ||
          m.quoted.caption ||
          "";
      }

      if (!message) message = "No message provided.";

      // read more
      const readMore = String.fromCharCode(8206).repeat(4001);

      const text = `
❀ TAGGED BY: @${sender.split("@")[0]}
❀ MESSAGE:
${message}
${readMore}
${members.map(u => `❀ @${u.split("@")[0]}`).join("\n")}
`.trim();

      await sock.sendMessage(jid, {
        text,
        mentions: members
      }, { quoted: m });

    } catch (err) {
      console.error("tagall error:", err);
      return reply("❌ Failed to execute tagall.");
    }
  }
});