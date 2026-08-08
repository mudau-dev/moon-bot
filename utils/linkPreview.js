const { getLinkPreview } = require('link-preview-js');

function normalizeHttpUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function createLinkPreview(value) {
  const url = normalizeHttpUrl(value);
  if (!url) return null;

  try {
    const metadata = await getLinkPreview(url, {
      timeout: 6_000,
      followRedirects: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; MoonlightHavenBot/1.0)' },
    });
    const imageUrl = Array.isArray(metadata.images) ? metadata.images[0] : undefined;
    return {
      url,
      title: metadata.title || 'Moonlight Haven',
      description: metadata.description || 'Open this Moonlight Haven page.',
      imageUrl,
    };
  } catch (error) {
    console.warn('[LINK PREVIEW]', error.message);
    return { url, title: 'Moonlight Haven', description: 'Open this Moonlight Haven page.' };
  }
}

function previewContext(preview) {
  if (!preview) return undefined;
  return {
    externalAdReply: {
      title: preview.title.slice(0, 120),
      body: preview.description.slice(0, 180),
      sourceUrl: preview.url,
      thumbnailUrl: preview.imageUrl,
      mediaType: 1,
      renderLargerThumbnail: Boolean(preview.imageUrl),
      showAdAttribution: false,
    },
  };
}

async function sendLinkPreview(sock, jid, message, url, text, options = {}) {
  const preview = await createLinkPreview(url);
  return sock.sendMessage(jid, {
    text,
    contextInfo: previewContext(preview),
    ...options,
  }, { quoted: message });
}

module.exports = { createLinkPreview, previewContext, sendLinkPreview };
