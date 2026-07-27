const axios = require("axios");

moon({
  name: "kiss",
  category: "interaction",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (m.message?.extendedTextMessage?.contextInfo?.participant) || null;
      
      if (!mentionedJid) {
        return reply("❌ Tag someone to kiss! Example: .kiss @user");
      }

      // Using an API that provides direct MP4 links for better WhatsApp auto-play
      const res = await axios.get("https://nekos.best/api/v2/kiss");
      const mp4Url = res.data.results[0].url;

      if (!mp4Url) throw new Error("API returned no URL");

      // Fetch the MP4 as a buffer to ensure it sends correctly as a GIF
      const response = await axios.get(mp4Url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      await sock.sendMessage(jid, {
        video: buffer,
        caption: `💋 *@${sender.split("@")[0]}* gave a sweet kiss to *@${mentionedJid.split("@")[0]}*!`,
        gifPlayback: true,
        mimetype: 'video/mp4',
        mentions: [sender, mentionedJid]
      }, { quoted: m });

    } catch (err) {
      console.error("kiss command error:", err);
      reply("❌ Failed to send kiss. Please try again later.");
    }
  }
});
