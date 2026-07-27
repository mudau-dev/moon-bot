const { isNSFWEnabled, fetchNekobot, nsfwDisabledMsg } = require('./_nsfwHelper');
const axios = require('axios');

// ── Helper to send an image ───────────────────────────────────────────────────
async function sendImg(sock, jid, m, url, caption) {
  return sock.sendMessage(jid, {
    image: { url },
    caption
  }, { quoted: m });
}

// ── .hentai ───────────────────────────────────────────────────────────────────
moon({
  name: 'hentai',
  category: 'nsfw',
  description: 'Random explicit adult anime artwork',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('hentai');
      return sendImg(sock, jid, m, url, '🔞 *Hentai — Adult Artwork*');
    } catch (err) {
      console.error('[HENTAI]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .ero ──────────────────────────────────────────────────────────────────────
moon({
  name: 'ero',
  category: 'nsfw',
  description: 'Random erotic anime artwork',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('hentai');
      return sendImg(sock, jid, m, url, '🔞 *Ero — Erotic Content*');
    } catch (err) {
      console.error('[ERO]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .milf ─────────────────────────────────────────────────────────────────────
moon({
  name: 'milf',
  category: 'nsfw',
  description: 'Explicit MILF anime artwork',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('boobs');
      return sendImg(sock, jid, m, url, '🔞 *MILF — Adult Content*');
    } catch (err) {
      console.error('[MILF]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .ass ──────────────────────────────────────────────────────────────────────
moon({
  name: 'ass',
  category: 'nsfw',
  description: 'Explicit artwork focused on body features',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('ass');
      return sendImg(sock, jid, m, url, '🔞 *Ass — Explicit View*');
    } catch (err) {
      console.error('[ASS]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .paizuri ──────────────────────────────────────────────────────────────────
moon({
  name: 'paizuri',
  category: 'nsfw',
  description: 'Explicit paizuri artwork',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('boobs');
      return sendImg(sock, jid, m, url, '🔞 *Paizuri — Adult Artwork*');
    } catch (err) {
      console.error('[PAIZURI]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .oral ─────────────────────────────────────────────────────────────────────
moon({
  name: 'oral',
  category: 'nsfw',
  description: 'Explicit oral artwork',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('hentai');
      return sendImg(sock, jid, m, url, '🔞 *Oral — Adult Content*');
    } catch (err) {
      console.error('[ORAL]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .nhentai ──────────────────────────────────────────────────────────────────
moon({
  name: 'nhentai',
  category: 'nsfw',
  description: 'Fetch a gallery by its numeric code',
  usage: '.nhentai <code>',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());

    const code = args[0];
    if (!code || !/^\d+$/.test(code)) {
      return reply(`❌ Invalid code. Example: *.nhentai 177013*`);
    }

    try {
      const res = await axios.get(`https://nhentai.net/api/gallery/${code}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          'Referer': 'https://nhentai.net/'
        },
        timeout: 12000
      });

      const data = res.data;
      if (!data) return reply(`❌ Gallery *${code}* not found.`);

      const title = data.title?.english || data.title?.pretty || 'Unknown';
      const pages = data.num_pages || 0;
      const mediaId = data.media_id;
      const coverExt = data.images?.cover?.t === 'p' ? 'png' : 'jpg';
      const coverUrl = `https://t.nhentai.net/galleries/${mediaId}/cover.${coverExt}`;

      const caption =
`╔══════════════════════╗
║   📖  NHENTAI GALLERY  ║
╚══════════════════════╝

🔢 *Code:* ${code}
📚 *Title:* ${title}
📄 *Pages:* ${pages}

🔗 *Link:* https://nhentai.net/g/${code}/`;

      try {
        return await sock.sendMessage(jid, { image: { url: coverUrl }, caption }, { quoted: m });
      } catch (_) {
        return reply(caption);
      }
    } catch (err) {
      return reply(`❌ Could not fetch gallery *${code}*.`);
    }
  }
});
