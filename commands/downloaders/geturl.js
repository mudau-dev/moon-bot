const axios = require("axios");

moon({
  name: "geturl",
  category: "downloaders",
  description: "Fetch image from URL",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const url = args[0];
      if (!url) return reply("❌ Provide an image URL.");

      await sock.sendMessage(jid, {
        image: { url },
        caption: "🖼️ Image fetched from URL"
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      reply("❌ Failed to fetch image.");
    }
  }
});