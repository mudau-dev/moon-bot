const NSFWGroup = require('../../models/athers/NSFWGroup');
const axios = require('axios');

/**
 * Check if NSFW is enabled for the given group.
 * Returns true if enabled, false otherwise.
 */
async function isNSFWEnabled(jid) {
  if (!jid.endsWith('@g.us')) return false; // groups only
  try {
    const record = await NSFWGroup.findOne({ groupId: jid });
    return record?.enabled === true;
  } catch {
    return false;
  }
}

/**
 * Fetch an image URL from nekobot.xyz
 * @param {string} type - The image type (e.g. 'neko', 'hentai', 'ass')
 */
async function fetchNekobot(type) {
  const res = await axios.get(`https://nekobot.xyz/api/image?type=${type}`, {
    timeout: 10000
  });
  if (res.data?.success && res.data?.message) {
    return res.data.message;
  }
  throw new Error(`nekobot returned no image for type: ${type}`);
}

/**
 * Fetch an image URL from nekos.best
 * @param {string} type - The image type (e.g. 'neko', 'waifu')
 */
async function fetchNekosBest(type) {
  const res = await axios.get(`https://nekos.best/api/v2/${type}`, {
    timeout: 10000
  });
  if (res.data?.results?.[0]?.url) {
    return res.data.results[0].url;
  }
  throw new Error(`nekos.best returned no image for type: ${type}`);
}

/**
 * Blocked message for when NSFW is disabled
 */
function nsfwDisabledMsg() {
  return (
`> 🚫 *NSFW is disabled in this group.*`
  );
}

module.exports = { isNSFWEnabled, fetchNekobot, fetchNekosBest, nsfwDisabledMsg };
