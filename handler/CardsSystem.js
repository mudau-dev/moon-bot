const Card = require("../models/Card");
const Group = require("../models/athers/Group");
const {
  fetchRandomCard,
  buildMediaPayload,
  getTierLabel,
} = require("../utils/cardGenerator");

const activeSpawns = global.activeSpawns || (global.activeSpawns = {});

// ================= CONFIG =================
const COOLDOWN_MS = 5 * 60 * 60 * 1000; // 5 HOURS
const MIN_MESSAGES_REQUIRED = 150;

// ================= CARD FORMAT =================
function formatSpawnCard(card) {
  return `
ㅤㅤ∘]───❀───[∘
*∘₊✧ MN CARD SPAWN* ❀
∘]───❀───[∘
🃏 𝗡𝗮𝗺𝗲: ${card.name}
⭐ 𝗧𝗶𝗲𝗿: ${getTierLabel(card.tier)}
💰 𝗣𝗿𝗰𝗲: ${Number(card.price || 0).toLocaleString()}
⏳ Type *.claim ${card.cardId}* to grab it
`.trim();
}

// ================= SPAWN =================
async function spawnCard(sock, jid) {
  try {
    if (!jid.endsWith("@g.us")) return;

    let group = await Group.findOne({ groupId: jid });
    if (!group) {
      group = await Group.create({ groupId: jid });
    }

    if (group.spawnEnabled !== true) return;

    const now = Date.now();
    const lastSpawn = group.lastSpawn ? group.lastSpawn.getTime() : 0;
    if (now - lastSpawn < COOLDOWN_MS) return;

    if ((group.totalMessages || 0) < MIN_MESSAGES_REQUIRED) {
      if (group.cardsSpawnedThisCycle === 0) {
        console.log(`[AUTO SPAWN] Skipping spawn in ${jid}: only ${group.totalMessages} messages.`);
        group.lastSpawn = new Date(now);
        group.totalMessages = 0;
        group.botMessages = 0;
        await group.save();
      }
      return;
    }

    if (activeSpawns[jid]) return;

    // The API card is upserted into MongoDB by fetchRandomCard before it is announced.
    const selected = await fetchRandomCard();
    const caption = formatSpawnCard(selected);
    const payload = buildMediaPayload(selected, caption) || { text: caption };

    activeSpawns[jid] = {
      cardId: selected.cardId,
      spawnedAt: now,
    };

    try {
      await sock.sendMessage(jid, payload);
    } catch (sendError) {
      delete activeSpawns[jid];
      throw sendError;
    }

    await Card.updateOne({ cardId: selected.cardId }, { $inc: { timesSpawned: 1 } });

    group.cardsSpawnedThisCycle = (group.cardsSpawnedThisCycle || 0) + 1;
    group.totalMessages = 0; // Reset progress bar after a successful spawn
    group.botMessages = 0;

    if (group.cardsSpawnedThisCycle >= 10) {
      group.lastSpawn = new Date(now);
      group.cardsSpawnedThisCycle = 0;
    }

    await group.save();
    console.log(`[AUTO SPAWN] ${selected.name} (${selected.cardId}) spawned in ${jid}.`);
  } catch (err) {
    console.error("[AUTO SPAWN ERROR]", err);
  }
}

// ================= SYSTEM =================
function startCardSystem(sock) {
  console.log("🃏 Auto Card Spawn System Started (API-backed, activity-based)");
  setInterval(async () => {
    try {
      const groups = await Group.find({ spawnEnabled: true });
      for (const group of groups) {
        if (!group.groupId) continue;
        await spawnCard(sock, group.groupId);
      }
    } catch (err) {
      console.error("[Spawn Loop Error]", err);
    }
  }, 60 * 1000);
}

module.exports = {
  startCardSystem,
  spawnCard,
};
