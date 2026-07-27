const axios = require("axios");
const yts = require("yt-search");

async function fetchAudioXemoz(query) {
  try {
    const { data } = await axios.get(
      `https://api-xemoz-official.my.id/api/donwloader/ytplay.php?q=${encodeURIComponent(query)}`,
      { timeout: 10000 }
    );
    if (data?.status && data?.result?.download?.audio) {
      return {
        audioUrl: data.result.download.audio,
        title: data.result.title || query
      };
    }
  } catch (err) {
    console.log("[PLAY] xemoz failed:", err.message);
  }
  return null;
}

async function fetchAudioFallback(url) {
  const endpoints = [
    {
      url: `https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=${encodeURIComponent(url)}`,
      type: "gifted"
    },
    {
      url: `https://bk9.fun/download/ytdl?url=${encodeURIComponent(url)}`,
      type: "bk9"
    }
  ];

  for (const endpoint of endpoints) {
    try {
      const { data } = await axios.get(endpoint.url, { timeout: 8000 });
      let audioUrl = null;

      if (endpoint.type === "gifted") {
        audioUrl = data.download_url || data.result?.download_url;
      } else if (endpoint.type === "bk9") {
        audioUrl = data.BK9?.download_url || data.result?.download_url || data.download_url || data.url;
      }

      if (audioUrl && audioUrl.startsWith("http")) return audioUrl;
    } catch (err) {
      console.log(`[PLAY] ${endpoint.type} failed:`, err.message);
    }
  }
  return null;
}

moon({
  name: "play",
  aliases: ["song", "music", "hall"],
  category: "downloaders",
  description: "Play YouTube audio (Plain audio for compatibility)",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const body = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
      const cmdName = body.trim().split(" ")[0]?.replace(".", "").toLowerCase();
      const isHall = cmdName === "hall";
      const query = args.join(" ").trim();

      if (!query) {
        return reply(`❌ Provide a song name.\nExample: *.play faded alan walker*`);
      }

      await sock.sendMessage(jid, { react: { text: "🎵", key: m.key } });

      let audioUrl = null;
      let title = "Audio";

      if (isHall) {
        const result = await fetchAudioXemoz(query);
        if (result?.audioUrl) {
          audioUrl = result.audioUrl;
          title = result.title;
        }
      } else {
        const search = await yts(query);
        if (search.videos.length) {
          const video = search.videos[0];
          title = video.title;
          
          // Send plain text info
          await reply(`🎵 *Fetching:* ${video.title}\n⏱️ *Duration:* ${video.timestamp}`);

          const xemozResult = await fetchAudioXemoz(video.title);
          if (xemozResult?.audioUrl) {
            audioUrl = xemozResult.audioUrl;
          } else {
            audioUrl = await fetchAudioFallback(video.url);
          }
        }
      }

      if (!audioUrl) {
        await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
        return reply("❌ Could not download the audio. Please try another song.");
      }

      // SEND PLAIN AUDIO (No contextInfo/externalAdReply)
      await sock.sendMessage(jid, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: `${title}.mp3`
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });

    } catch (err) {
      console.error("[PLAY ERROR]", err);
      await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
      return reply("❌ Play command failed.");
    }
  }
});
