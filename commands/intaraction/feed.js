const axios = require("axios");

moon({
  name: "feed",
  category: "interaction",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (m.message?.extendedTextMessage?.contextInfo?.participant) || null;
      
      if (!mentionedJid) {
        return reply("❌ Tag someone to feed! Example: .feed @user");
      }

      const res = await axios.get("https://nekos.best/api/v2/feed");
      const mp4Url = res.data.results[0].url;

      if (!mp4Url) throw new Error("API returned no URL");

      const response = await axios.get(mp4Url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      await sock.sendMessage(jid, {
        video: buffer,
        caption: `🍴 *@${sender.split("@")[0]}* fed *@${mentionedJid.split("@")[0]}*!`,
        gifPlayback: true,
        mimetype: 'video/mp4',
        mentions: [sender, mentionedJid]
      }, { quoted: m });

    } catch (err) {
      console.error("feed command error:", err);
      reply("❌ Failed to send feed. Please try again later.");
    }
  }
});
