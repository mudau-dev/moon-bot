const config = require('../../config');

moon({
  name: "tag",
  category: "group",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      if (!jid.endsWith("@g.us")) return;

      const metadata = await sock.groupMetadata(jid);

      const user = metadata.participants.find(p => p.id === sender);
      if (!user || !user.admin) return;

      const bot = metadata.participants.find(p => p.id === config.BOT_JID);
      if (!bot || !bot.admin) return;

      const members = metadata.participants.map(p => p.id);

      const quotedCtx = m.message?.extendedTextMessage?.contextInfo;
      const hasQuoted = !!quotedCtx?.stanzaId;

      // -------- CASE 1: reply to ANY message (text/media/sticker) --------
      if (hasQuoted) {
        try {
          await sock.sendMessage(jid, {
            forward: {
              key: {
                remoteJid: jid,
                id: quotedCtx.stanzaId,
                participant: quotedCtx.participant
              },
              message: m.quoted?.message
            },
            mentions: members
          });
        } catch {
          // fallback if forward fails
          await sock.sendMessage(jid, {
            text: "ㅤㅤㅤㅤ",
            mentions: members
          });
        }

      } else {
        // -------- CASE 2: text or fallback --------
        let message = args.join(" ").trim();

        if (!message) {
          message = "‎‎‎‎‎‎ㅤ"; // your required blank
        }

        await sock.sendMessage(jid, {
          text: message,
          mentions: members
        }, { quoted: m });
      }

      // -------- DELETE .tag COMMAND --------
      try {
        await sock.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: true,
            id: m.key.id,
            participant: m.key.participant || sender
          }
        });
      } catch {}

    } catch (err) {
      console.error("tag error:", err);
      // silent
    }
  }
});