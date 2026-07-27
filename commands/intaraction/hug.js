moon({
  name: "hug",
  category: "interaction",
  cooldown: 5,
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      // ✅ LAZY LOAD AXIOS
      const axios = require("axios");

      const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (m.message?.extendedTextMessage?.contextInfo?.participant) || null;
      
      if (!mentionedJid) {
        return reply("❌ Tag someone to hug! Example: .hug @user");
      }

      const res = await axios.get("https://nekos.best/api/v2/hug");
      const mp4Url = res.data.results[0].url;

      if (!mp4Url) throw new Error("API returned no URL");

      const response = await axios.get(mp4Url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      await sock.sendMessage(jid, {
        video: buffer,
        caption: `🫂 *@${sender.split("@")[0]}* gave a warm hug to *@${mentionedJid.split("@")[0]}*!`,
        gifPlayback: true,
        mimetype: 'video/mp4',
        mentions: [sender, mentionedJid]
      }, { quoted: m });

    } catch (err) {
      console.error("hug command error:", err);
      reply("❌ Failed to send hug. Please try again later.");
    }
  }
});
