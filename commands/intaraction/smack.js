const axios = require("axios");

moon({
  name: "smack",
  category: "interaction",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (m.message?.extendedTextMessage?.contextInfo?.participant) || null;
      
      if (!mentionedJid) {
        return reply("❌ Tag someone to smack! Example: .smack @user");
      }

      const res = await axios.get("https://nekos.best/api/v2/smack");
      const mp4Url = res.data.results[0].url;

      if (!mp4Url) throw new Error("API returned no URL");

      const response = await axios.get(mp4Url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      await sock.sendMessage(jid, {
        video: buffer,
        caption: `💥 *@${sender.split("@")[0]}* smacked *@${mentionedJid.split("@")[0]}*!`,
        gifPlayback: true,
        mimetype: 'video/mp4',
        mentions: [sender, mentionedJid]
      }, { quoted: m });

    } catch (err) {
      console.error("smack command error:", err);
      reply("❌ Failed to send smack. Please try again later.");
    }
  }
});
