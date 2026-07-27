const axios = require("axios");
const crypto = require("crypto");
const Card = require("../models/Card");

const CARD_API_BASE_URL = String(
process.env.CARD_API_BASE_URL || "https://cardapi.eclipse.name.ng/api"
).replace(/\/$/, "");

const API_TIMEOUT_MS = Number(process.env.CARD_API_TIMEOUT_MS || 15000);

// Stored keys are deliberately compact because commands use them as filters.
// The remote API uses numeric strings, where its tier 6 is represented here as S.
const LEGACY_TIER_KEYS = {
common: "1",
uncommon: "2",
rare: "3",
epic: "4",
legendary: "5",
mythic: "S",
divine: "T7",
};

const BASE_TIER_KEYS = ["1", "2", "3", "4", "5", "S"];
const DEFAULT_PRICES = {
"1": 5000,
"2": 10000,
"3": 25000,
"4": 50000,
"5": 300000,
S: 500000,
};

async function searchApiCards(query, limit = 25) {
const cards = await requestApi("/search", {
q: normalizeText(query),
limit,
});

return saveCards(cards, limit);
}

const http = axios.create({
baseURL: CARD_API_BASE_URL,
timeout: API_TIMEOUT_MS,
headers: { Accept: "application/json" },
});

function normalizeText(value, fallback = "") {
const text = String(value ?? "").trim();
return text || fallback;
}

function tierKeyFromNumber(number) {
const value = Number.parseInt(number, 10);
if (!Number.isFinite(value) || value < 1) return null;
if (value <= 5) return String(value);
if (value === 6) return "S";
return `T${value}`;
}

function normalizeTier(value, fallback = "1") {
const raw = normalizeText(value).toLowerCase();
if (!raw) return fallback;

if (LEGACY_TIER_KEYS[raw]) return LEGACY_TIER_KEYS[raw];
if (raw === "s" || raw === "tier s" || raw === "6") return "S";

const tierMatch = raw.match(/^tier\s*([0-9]+)$/i);
if (tierMatch) return tierKeyFromNumber(tierMatch[1]) || fallback;

if (/^[0-9]+$/.test(raw)) return tierKeyFromNumber(raw) || fallback;

const futureTierMatch = raw.match(/^t(?:ier)?\s*([0-9]+)$/i);
if (futureTierMatch) return tierKeyFromNumber(futureTierMatch[1]) || fallback;

return raw.toUpperCase();
}

function tierKeyToApiTier(value) {
const tier = normalizeTier(value, null);
if (!tier) return null;
if (tier === "S") return "6";
if (/^[1-5]$/.test(tier)) return tier;
const futureTierMatch = tier.match(/^T([0-9]+)$/);
return futureTierMatch ? futureTierMatch[1] : null;
}

function getTierNumber(value) {
const apiTier = tierKeyToApiTier(value);
return apiTier ? Number.parseInt(apiTier, 10) : 0;
}

function getTierLabel(value) {
const tier = normalizeTier(value);
if (tier === "S") return "Tier S";
if (/^T[0-9]+$/.test(tier)) return `Tier ${tier.slice(1)}`;
if (/^[1-9][0-9]*$/.test(tier)) return `Tier ${tier}`;
return `Tier ${tier}`;
}

function getTierKeys(values = []) {
const discovered = new Set(BASE_TIER_KEYS);
for (const value of values) {
const source = value && typeof value === "object" ? value.tier : value;
const tier = normalizeTier(source, null);
if (tier) discovered.add(tier);
}

return [...discovered].sort((left, right) => {
const leftNumber = getTierNumber(left) || Number.MAX_SAFE_INTEGER;
const rightNumber = getTierNumber(right) || Number.MAX_SAFE_INTEGER;
if (leftNumber !== rightNumber) return leftNumber - rightNumber;
return left.localeCompare(right);
});
}

function getDefaultPrice(tier) {
const normalizedTier = normalizeTier(tier);
if (Number.isFinite(Number(process.env.CARD_API_DEFAULT_PRICE))) {
return Math.max(0, Number(process.env.CARD_API_DEFAULT_PRICE));
}

if (Object.prototype.hasOwnProperty.call(DEFAULT_PRICES, normalizedTier)) {
return DEFAULT_PRICES[normalizedTier];
}

const tierNumber = getTierNumber(normalizedTier);
return tierNumber > 6 ? 25000 * Math.max(1, tierNumber - 5) : DEFAULT_PRICES["1"];
}

function getStableCardId(apiCard) {
const fingerprint = [
normalizeTier(apiCard?.tier),
normalizeText(apiCard?.title || apiCard?.name),
normalizeText(apiCard?.series),
normalizeText(apiCard?.url || apiCard?.media),
].join("|");

const hash = crypto.createHash("sha1").update(fingerprint).digest("hex").slice(0, 14).toUpperCase();
return `EC-${hash}`;
}

function inferMediaType(media, declaredType) {
if (declaredType === "video") return "video";
const url = getMediaUrl(media).toLowerCase();
return /\.(gif|mp4|webm|mov)(?:$|[?#])/i.test(url) ? "video" : "image";
}

function getMediaUrl(media) {
if (!media) return "";
if (typeof media === "string") return media.trim();

if (Buffer.isBuffer(media)) {
const possibleUrl = media.toString("utf8").trim();
return /^https?:\/\//i.test(possibleUrl) ? possibleUrl : "";
}

if (media && Array.isArray(media.data)) {
const possibleUrl = Buffer.from(media.data).toString("utf8").trim();
return /^https?:\/\//i.test(possibleUrl) ? possibleUrl : "";
}

if (media && typeof media.url === "string") return media.url.trim();
return "";
}

function getMediaBuffer(media) {
if (Buffer.isBuffer(media)) return media;
if (media && Array.isArray(media.data)) return Buffer.from(media.data);
return null;
}

function buildMediaPayload(card, caption) {
const media = card?.media;
const url = getMediaUrl(media);
const mediaType = inferMediaType(media, card?.mediaType);
const data = url ? { url } : getMediaBuffer(media);
if (!data) return null;

if (mediaType === "video") {
return { video: data, gifPlayback: true, caption };
}

return { image: data, caption };
}

function serializeMarketMedia(media) {
const url = getMediaUrl(media);
if (url) return url;
const buffer = getMediaBuffer(media);
return buffer ? `base64:${buffer.toString("base64")}` : "no-image";
}

function deserializeMarketMedia(value) {
if (!value || value === "no-image") return undefined;
if (/^https?:\/\//i.test(value)) return value;
if (value.startsWith("base64:")) return Buffer.from(value.slice(7), "base64");
// Legacy market records stored bare base64 strings.
return Buffer.from(value, "base64");
}

function toCardDocument(apiCard) {
if (!apiCard || typeof apiCard !== "object") {
throw new Error("Card API returned no card data.");
}

const name = normalizeText(apiCard.title || apiCard.name);
const media = normalizeText(apiCard.url || apiCard.media);
if (!name || !media) {
throw new Error("Card API returned an incomplete card.");
}

const tier = normalizeTier(apiCard.tier);
return {
cardId: normalizeText(apiCard.cardId) || crypto.randomBytes(3).toString("hex"), // Generates a 6-character hex ID like 1a2b3c
name,
description: normalizeText(apiCard.description),
series: normalizeText(apiCard.series, "Unknown"),
media,
mediaType: inferMediaType(media, apiCard.mediaType),
mediaMime: normalizeText(apiCard.mediaMime),
tier,
price: Number.isFinite(Number(apiCard.price)) ? Number(apiCard.price) : getDefaultPrice(tier),
creator: normalizeText(apiCard.creator, "Eclipse Card API"),
spawnRate: Math.max(1, Number(apiCard.spawnRate) || 1),
enabled: apiCard.enabled !== false,
};
}

async function requestApi(path, params) {
try {
const response = await http.get(path, { params });
const payload = response.data;
if (!payload || payload.success !== true) {
throw new Error(payload?.error || "Card API request failed.");
}
return payload.data;
} catch (error) {
const detail = error.response?.data?.error || error.message || "Unknown API error";
throw new (`Error Card API error: ${detail}`);
}
}

async function saveCard(apiCard) {
const document = toCardDocument(apiCard);
const saved = await Card.findOneAndUpdate(
{ cardId: document.cardId },
{
$set: {
name: document.name,
description: document.description,
series: document.series,
media: document.media,
mediaType: document.mediaType,
mediaMime: document.mediaMime,
tier: document.tier,
creator: document.creator,
spawnRate: document.spawnRate,
enabled: document.enabled,
},
$setOnInsert: {
cardId: document.cardId,
price: document.price,
timesSpawned: 0,
timesClaimed: 0,
},
},
{ upsert: true, new: true, setDefaultsOnInsert: true }
);

return saved;
}

async function saveCards(apiCards, limit = 100) {
const list = Array.isArray(apiCards) ? apiCards.slice(0, limit) : [];
const saved = [];
for (const apiCard of list) {
try {
saved.push(await saveCard(apiCard));
} catch (error) {
console.warn("[CARD API] Skipped invalid card:", error.message);
}
}
return saved;
}

async function fetchRandomCard(tierInput = null) {
const normalizedTier = tierInput ? normalizeTier(tierInput, null) : null;
const apiTier = normalizedTier ? tierKeyToApiTier(normalizedTier) : null;
if (normalizedTier && !apiTier) {
return Card.findOne({ name: new RegExp(`^${escaped}$`, "i") });
}

const card = await requestApi("/random", apiTier ? { tier: apiTier } : undefined);
return saveCard(card);
}

async function fetchCardsBySeries(series, limit = 50) {
const query = normalizeText(series);
if (!query) return [];
const cards = await requestApi("/cards", { anime: query });
return saveCards(cards, Math.max(1, Math.min(Number(limit) || 50, 200)));
}

async function findStoredCard(query) {
const value = normalizeText(query);
if (!value) return null;

const byId = await Card.findOne({ cardId: value });
if (byId) return byId;

const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
return Card.findOne({ name: new RegExp(`^${escaped}$`, "i") });
}

async function searchStoredCards(query, limit = 5) {
const value = normalizeText(query);
if (!value) return [];
const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
return Card.find({
$or: [
{ cardId: value },
{ name: new RegExp(escaped, "i") },
{ series: new RegExp(escaped, "i") },
],
})
.sort({ name: 1 })
.limit(Math.max(1, Math.min(Number(limit) || 5, 25)));
}

// The public API exposes a series (anime) filter, but not a title-search endpoint.
// On a local cache miss, fetch that series from the API and persist the returned cards.
async function searchCards(query, limit = 5) {
const normalizedLimit = Math.max(1, Math.min(Number(limit) || 5, 25));
const stored = await searchStoredCards(query, normalizedLimit);
if (stored.length) return stored;

try {
const fetched = await fetchCardsBySeries(query, Math.max(50, normalizedLimit));
const text = normalizeText(query).toLowerCase();
return fetched
.filter((card) => {
const name = normalizeText(card.name).toLowerCase();
const series = normalizeText(card.series).toLowerCase();
return name.includes(text) || series.includes(text);
})
.slice(0, normalizedLimit);
} catch (error) {
console.warn("[CARD API] Search fallback failed:", error.message);
return [];
}
}

function makeInventoryCard(card) {
return {
cardId: card.cardId,
name: card.name,
tier: normalizeTier(card.tier),
price: Number(card.price || 0),
description: card.description || "",
series: card.series || "Unknown",
creator: card.creator || "Eclipse Card API",
media: card.media || null,
mediaType: inferMediaType(card.media, card.mediaType),
mediaMime: card.mediaMime || "",
obtainedAt: new Date(),
};
}

module.exports = {
CARD_API_BASE_URL,
BASE_TIER_KEYS,
normalizeTier,
tierKeyToApiTier,
getTierNumber,
getTierLabel,
getTierKeys,
getDefaultPrice,
getStableCardId,
inferMediaType,
getMediaUrl,
buildMediaPayload,
serializeMarketMedia,
deserializeMarketMedia,
toCardDocument,
saveCard,
saveCards,
fetchRandomCard,
fetchCardsBySeries,
findStoredCard,
searchStoredCards,
searchCards,
makeInventoryCard,
};