const axios = require("axios");

moon({
  name: "bite",
  category: "interaction",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const context = m.message?.extendedTextMessage?.contextInfo;

      // target: tag OR reply
      const target =
        context?.mentionedJid?.[0] ||
        context?.participant ||
        null;

      if (!target) {
        return reply("Tag or reply to someone to bite them.");
      }

      // API call
      const res = await axios.get("https://nekos.best/api/v2/bite");

      const result = res.data?.results?.[0];
      const mediaUrl = result?.url;

      if (!mediaUrl) {
        return reply("Bite API returned no media.");
      }

      // download media
      const media = await axios.get(mediaUrl, {
        responseType: "arraybuffer"
      });

      const buffer = Buffer.from(media.data);

      await sock.sendMessage(
        jid,
        {
          video: buffer, // nekos.best bite is usually gif/mp4 video
          gifPlayback: true,
          mimetype: "video/mp4",
          caption: `🦷 @${sender.split("@")[0]} bit @${target.split("@")[0]}!`,
          mentions: [sender, target]
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("bite cmd error:", err);
      reply("❌ Bite command failed. Try again later.");
    }
  }
});