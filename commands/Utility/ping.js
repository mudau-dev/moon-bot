const config = require('../../config');
const axios = require('axios');

moon({
  name: "ping",
  roles: [], // Public command
  category: "Utility",
  description: "Check bot speed with live edit",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      const start = Date.now();

      // ---------------- STICKER FIRST ----------------
      try {
        const stickerUrl = "https://mmg.whatsapp.net/v/t62.15575-24/627489644_2227518930990402_7039546539033854746_n.enc?ccb=11-4&oh=01_Q5Aa4QERYH3ePZyovO37NVoc9S1NPQmC-06xuBy2FlTFPK-jmg&oe=6A1529CA&_nc_sid=5e03e0&mms3=true";

        const res = await axios.get(stickerUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);

        await sock.sendMessage(jid, {
          sticker: buffer
        }, { quoted: m });

      } catch (err) {
        console.error("Sticker send failed:", err.message);
      }

      // ---------------- INITIAL MESSAGE ----------------
      const msg = await sock.sendMessage(jid, {
        text: "⏳ Initializing speed test..."
      }, { quoted: m });

      const latency = Date.now() - start;

      // ---------------- EDIT STAGES ----------------

      await delay(sock, jid, msg, "🔄 Checking connection...");
      await delay(sock, jid, msg, "⚡ Measuring latency...");
      await delay(sock, jid, msg, "📡 Processing response...");
      await delay(sock, jid, msg, `*${config.BOT_NAME}* speed: \`${latency}\` ms`);

    } catch (err) {
      console.error("Ping error:", err);
      return reply("❌ Ping failed.");
    }
  }
});

// ---------------- HELPER ----------------
async function delay(sock, jid, msg, text) {
  await new Promise(r => setTimeout(r, 700));

  await sock.sendMessage(jid, {
    text,
    edit: msg.key
  });
}