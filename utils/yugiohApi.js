// utils/yugiohApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Thin wrapper around the official YGOPRODeck REST API v7.
// https://ygoprodeck.com/api-guide/
// All functions return plain JS objects — no DB writes happen here.
// ─────────────────────────────────────────────────────────────────────────────

const https = require('https');

const BASE = 'https://db.ygoprodeck.com/api/v7';

// ── Simple HTTPS GET → JSON ───────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('YGOPRODeck: invalid JSON — ' + e.message)); }
      });
    }).on('error', reject);
  });
}

// ── Rarity helper ─────────────────────────────────────────────────────────────
// Maps the most common set rarity string to a simple tier label.
const RARITY_MAP = {
  'Common':             'Common',
  'Short Print':        'Common',
  'Rare':               'Rare',
  'Super Rare':         'Super Rare',
  'Ultra Rare':         'Ultra Rare',
  'Secret Rare':        'Secret Rare',
  'Ultimate Rare':      'Ultimate Rare',
  'Ghost Rare':         'Ghost Rare',
  'Starlight Rare':     'Starlight Rare',
  'Collector\'s Rare':  'Collector\'s Rare',
  'Prismatic Secret Rare': 'Prismatic Secret Rare',
};

const RARITY_EMOJI = {
  'Common':               '⚪',
  'Rare':                 '🔵',
  'Super Rare':           '🟣',
  'Ultra Rare':           '🟡',
  'Secret Rare':          '🔴',
  'Ultimate Rare':        '🟠',
  'Ghost Rare':           '👻',
  'Starlight Rare':       '⭐',
  "Collector's Rare":     '💎',
  'Prismatic Secret Rare':'🌈',
};

function getRarity(card) {
  const sets = card.card_sets || [];
  if (!sets.length) return 'Common';
  // Count occurrences of each rarity across all printings
  const counts = {};
  for (const s of sets) {
    const r = RARITY_MAP[s.set_rarity] || 'Common';
    counts[r] = (counts[r] || 0) + 1;
  }
  // Return the most common rarity
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function rarityEmoji(rarity) {
  return RARITY_EMOJI[rarity] || '⚪';
}

// ── Card formatters ───────────────────────────────────────────────────────────
function formatCardStats(card) {
  const parts = [];
  if (card.level != null)     parts.push(`⭐ Level/Rank: ${card.level}`);
  if (card.atk   != null)     parts.push(`⚔️ ATK: ${card.atk}`);
  if (card.def   != null)     parts.push(`🛡️ DEF: ${card.def}`);
  if (card.attribute)         parts.push(`🌀 Attribute: ${card.attribute}`);
  if (card.race)              parts.push(`🐉 Type/Race: ${card.race}`);
  return parts.join('\n');
}

function normaliseCard(raw) {
  const rarity = getRarity(raw);
  return {
    cardId:    raw.id,
    name:      raw.name,
    type:      raw.type,
    frameType: raw.frameType,
    desc:      raw.desc,
    race:      raw.race       || null,
    attribute: raw.attribute  || null,
    atk:       raw.atk        ?? null,
    def:       raw.def        ?? null,
    level:     raw.level      ?? null,
    imageUrl:  raw.card_images?.[0]?.image_url || null,
    rarity,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch a random card from YGOPRODeck.
 * Uses ?num=1&offset=<random> for true randomness.
 */
async function fetchRandomCard() {
  // First get total card count
  const info = await fetchJSON(`${BASE}/cardinfo.php?num=1&offset=0`);
  const total = info.meta?.total_rows || 12000;
  const offset = Math.floor(Math.random() * (total - 1));
  const data = await fetchJSON(`${BASE}/cardinfo.php?num=1&offset=${offset}`);
  if (!data.data?.length) throw new Error('No card returned');
  return normaliseCard(data.data[0]);
}

/**
 * Search cards by name (fuzzy).
 */
async function searchCardByName(query) {
  const encoded = encodeURIComponent(query);
  const data = await fetchJSON(`${BASE}/cardinfo.php?fname=${encoded}&num=10`);
  if (!data.data?.length) return [];
  return data.data.map(normaliseCard);
}

/**
 * Get a card by exact name.
 */
async function getCardByName(name) {
  const encoded = encodeURIComponent(name);
  const data = await fetchJSON(`${BASE}/cardinfo.php?name=${encoded}`);
  if (!data.data?.length) return null;
  return normaliseCard(data.data[0]);
}

/**
 * Get a card by YGOPRODeck numeric ID.
 */
async function getCardById(id) {
  const data = await fetchJSON(`${BASE}/cardinfo.php?id=${id}`);
  if (!data.data?.length) return null;
  return normaliseCard(data.data[0]);
}

module.exports = {
  fetchRandomCard,
  searchCardByName,
  getCardByName,
  getCardById,
  getRarity,
  rarityEmoji,
  formatCardStats,
  normaliseCard,
};
