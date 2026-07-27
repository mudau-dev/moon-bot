const { isNSFWEnabled, fetchNekobot, fetchNekosBest, nsfwDisabledMsg } = require('./_nsfwHelper');

// ── Helper to send an image ───────────────────────────────────────────────────
async function sendImg(sock, jid, m, url, caption) {
  return sock.sendMessage(jid, {
    image: { url },
    caption
  }, { quoted: m });
}

// ── .waifu ────────────────────────────────────────────────────────────────────
moon({
  name: 'waifu',
  category: 'nsfw',
  description: 'Random anime waifu image',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekosBest('waifu');
      return sendImg(sock, jid, m, url, '🌸 *Random Anime Waifu*');
    } catch (err) {
      console.error('[WAIFU]', err.message);
      return reply('❌ Could not fetch a waifu image. Try again!');
    }
  }
});

// ── .neko ─────────────────────────────────────────────────────────────────────
moon({
  name: 'neko',
  category: 'nsfw',
  description: 'Random anime neko image',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekosBest('neko');
      return sendImg(sock, jid, m, url, '🐱 *Random Anime Neko*');
    } catch (err) {
      console.error('[NEKO]', err.message);
      return reply('❌ Could not fetch a neko image. Try again!');
    }
  }
});

// ── .maid ─────────────────────────────────────────────────────────────────────
moon({
  name: 'maid',
  category: 'nsfw',
  description: 'Random anime maid image',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      // Try nekos.best first, fall back to nekobot neko
      let url;
      try { url = await fetchNekosBest('waifu'); }
      catch { url = await fetchNekobot('neko'); }
      return sendImg(sock, jid, m, url, '🧹 *Random Anime Maid*');
    } catch (err) {
      console.error('[MAID]', err.message);
      return reply('❌ Could not fetch a maid image. Try again!');
    }
  }
});

// ── .selfies ──────────────────────────────────────────────────────────────────
moon({
  name: 'selfies',
  category: 'nsfw',
  description: 'Random anime selfie image',
  aliases: ['selfie'],
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekosBest('waifu');
      return sendImg(sock, jid, m, url, '📸 *Random Anime Selfie*');
    } catch (err) {
      console.error('[SELFIES]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .uniform ──────────────────────────────────────────────────────────────────
moon({
  name: 'uniform',
  category: 'nsfw',
  description: 'Anime school uniform image',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekosBest('waifu');
      return sendImg(sock, jid, m, url, '🎒 *Anime School Uniform*');
    } catch (err) {
      console.error('[UNIFORM]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .cosplay ──────────────────────────────────────────────────────────────────
moon({
  name: 'cosplay',
  category: 'nsfw',
  description: 'Anime cosplay image',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('neko');
      return sendImg(sock, jid, m, url, '🎭 *Anime Cosplay*');
    } catch (err) {
      console.error('[COSPLAY]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .yuri ─────────────────────────────────────────────────────────────────────
moon({
  name: 'yuri',
  category: 'nsfw',
  description: "Girls' Love anime artwork",
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('hentai');
      return sendImg(sock, jid, m, url, '💜 *Yuri — Girls Love*');
    } catch (err) {
      console.error('[YURI]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .yaoi ─────────────────────────────────────────────────────────────────────
moon({
  name: 'yaoi',
  category: 'nsfw',
  description: "Boys' Love anime artwork",
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('hentai');
      return sendImg(sock, jid, m, url, '💙 *Yaoi — Boys Love*');
    } catch (err) {
      console.error('[YAOI]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .oppai ────────────────────────────────────────────────────────────────────
moon({
  name: 'oppai',
  category: 'nsfw',
  description: 'Large-bust anime artwork',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('boobs');
      return sendImg(sock, jid, m, url, '🍒 *Oppai*');
    } catch (err) {
      console.error('[OPPAI]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});

// ── .ecchi ────────────────────────────────────────────────────────────────────
moon({
  name: 'ecchi',
  category: 'nsfw',
  description: 'Suggestive anime artwork',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isNSFWEnabled(jid))) return reply(nsfwDisabledMsg());
    try {
      const url = await fetchNekobot('hentai');
      return sendImg(sock, jid, m, url, '🌶️ *Ecchi*');
    } catch (err) {
      console.error('[ECCHI]', err.message);
      return reply('❌ Could not fetch image. Try again!');
    }
  }
});
