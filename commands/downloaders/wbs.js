const axios = require("axios");

function normalizeUrl(raw) {
  let value = String(raw || "").trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

async function fetchScreenshot(url) {
  const services = [
    `https://image.thum.io/get/width/1366/crop/768/noanimate/${url}`,
    `https://mini.s-shot.ru/1366x768/PNG/1366/Z100/?${encodeURIComponent(url)}`,
    `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1366&viewport.height=768&deviceScaleFactor=1`
  ];

  let lastError = null;

  for (const service of services) {
    try {
      const res = await axios.get(service, {
        timeout: 30000,
        responseType: 'arraybuffer',
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
        },
        validateStatus: status => status >= 200 && status < 400
      });

      const contentType = String(res.headers['content-type'] || '').toLowerCase();
      const buffer = Buffer.from(res.data);

      if (contentType.includes('application/json')) {
        const json = JSON.parse(buffer.toString('utf8'));
        const img = json?.data?.screenshot?.url || json?.screenshot?.url;
        if (img) return fetchScreenshot(img);
      }

      if (buffer.length > 1000 && contentType.startsWith('image/')) {
        return buffer;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('No screenshot service returned an image');
}

moon({
  name: "wbs",
  category: "downloaders",
  description: "Fetch the first page screenshot of a link in desktop mode",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const url = normalizeUrl(args.join(" "));
      if (!url) return reply("❌ Usage: .wb <website link>\nExample: .wb https://example.com");

      const status = await sock.sendMessage(jid, {
        text: `🖥️ Capturing desktop first-page screenshot...\n🌐 ${url}`
      }, { quoted: m });

      const image = await fetchScreenshot(url);

      await sock.sendMessage(jid, {
        text: "✅ Screenshot captured.",
        edit: status.key
      });

      return sock.sendMessage(jid, {
        image,
        caption: `🖥️ *Desktop Screenshot*\n🌐 ${url}`
      }, { quoted: m });

    } catch (err) {
      console.error("WB SCREENSHOT ERROR:", err?.response?.data || err.message);
      return reply("❌ Failed to capture that page. The site may block screenshots or the screenshot service may be down.");
    }
  }
});
