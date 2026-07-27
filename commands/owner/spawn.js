const Card = require("../../models/Card");
const User = require("../../models/User");
const Group = require("../../models/athers/Group");
const {
  fetchRandomCard,
  buildMediaPayload,
  getTierLabel,
  normalizeTier,
  tierKeyToApiTier,
} = require("../../utils/cardGenerator");

const activeSpawns = global.activeSpawns || (global.activeSpawns = {});

async function triggerSpawn(sock, jid, forcedTier = null) {
  try {
    // fetchRandomCard always stores the API response before it can be claimed.
    const card = await fetchRandomCard(forcedTier);
    if (!card) return false;

    activeSpawns[jid] = {
      cardId: card.cardId,
      time: Date.now(),
    };

    const caption = `ㅤㅤ∘]───❀───[∘
*∘₊✧ MN CARD SPAWNED* ❀
∘]───❀───[∘
🃏 *Name:* ${card.name}
⭐ *Tier:* ${getTierLabel(card.tier)}
💰 *Price:* $${Number(card.price || 0).toLocaleString()}
⏳ *Status:* UNCLAIMED
Type *.claim* ${card.cardId}
∘──────∘`;

    const payload = buildMediaPayload(card, caption) || { text: caption };
    try {
      await sock.sendMessage(jid, payload);
    } catch (sendError) {
      delete activeSpawns[jid];
      throw sendError;
    }

    await Card.updateOne(
      { cardId: card.cardId },
      { $inc: { timesSpawned: 1 } }
    );
    return true;
  } catch (err) {
    console.error("[SPAWN ERROR]", err);
    delete activeSpawns[jid];
    return false;
  }
}

module.exports.triggerSpawn = triggerSpawn;

moon({
  name: "spawn",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Card spawn system control",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith("@g.us")) {
        return reply("❌ Group only.");
      }

      const senderNumber = sender.split("@")[0];
      const user = await User.findOne({ userId: senderNumber });
      if (!user || (user.role !== "Owner" && user.role !== "True Owner")) {
        return reply("❌ You don't have permission to do that");
      }

      const sub = (args[0] || "").toLowerCase();
      let group = await Group.findOne({ groupId: jid });
      if (!group) group = await Group.create({ groupId: jid });

      if (sub === "on") {
        if (group.spawnEnabled) return reply("⚠️ Spawn already enabled.");
        group.spawnEnabled = true;
        await group.save();
        return reply("✅ Spawn enabled.");
      }

      if (sub === "off") {
        if (!group.spawnEnabled) return reply("⚠️ Spawn already disabled.");
        group.spawnEnabled = false;
        await group.save();
        return reply("> ⛔ Spawn is currently disabled for this chat.");
      }

      if (sub === "force") {
        if (!group.spawnEnabled) {
          return reply("> ❌ Spawn is currently OFF for this group chat.");
        }

        const requestedTier = args[1];
        let forcedTier = null;
        if (requestedTier) {
          const normalizedTier = normalizeTier(requestedTier, null);
          if (!normalizedTier || !tierKeyToApiTier(normalizedTier)) {
            return reply(
`❌ Invalid or unavailable tier.
Use 1, 2, 3, 4, 5, or S (S = API tier 6).
Future numeric tiers are accepted automatically when the card API provides them.`
            );
          }
          forcedTier = normalizedTier;
        }

        const success = await triggerSpawn(sock, jid, forcedTier);
        if (!success) {
          return reply("❌ Failed to fetch and spawn a card from the card API.");
        }
        return reply(
          forcedTier
            ? `🃏 ${getTierLabel(forcedTier)} card spawned.`
            : "🃏 Random API card spawned."
        );
      }

      return reply(
`📌 Usage:
.spawn on
.spawn off
.spawn force
.spawn force 1
.spawn force 2
.spawn force 3
.spawn force 4
.spawn force 5
.spawn force S`
      );
    } catch (err) {
      console.error("[SPAWN CMD ERROR]", err);
      return reply("❌ Spawn system failed.");
    }
  },
});
