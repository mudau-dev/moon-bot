const axios = require("axios");

moon({
  name: "ttk",
  category: "Utility",
  description: "TikTok downloader",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const url = args[0];
      if (!url) return reply("Send TikTok URL");

      const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;

      const { data } = await axios.get(api, { timeout: 20000 });

      const info = data?.data;

      const video = info?.play;

      if (!video) {
        return reply("Failed to fetch video");
      }

      const title = info?.title || "No title";
      const duration = info?.duration ? `${info.duration}s` : "Unknown";
      const user = info?.author?.nickname || info?.author || "Unknown";
      const desc = info?.title || info?.desc || "No description";

      const caption =
`🎵 TikTok Download

📝 ${title}
⏱ Duration: ${duration}
👤 User: ${user}
🏷 Desc: ${desc}`;

      await sock.sendMessage(jid, {
        video: { url: video },
        caption
      }, { quoted: m });

    } catch (err) {
      console.log(err?.response?.data || err.message);
      reply("Download failed");
    }
  }
});