const Card = require("../../models/Card");
const User = require("../../models/User");
const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");
const {
  getTierKeys,
  getTierLabel,
  normalizeTier,
} = require("../../utils/cardGenerator");

moon({
  name: "cards",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Full card system stats",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const senderNumber = sender.split("@")[0];
      const senderUser = await User.findOne({ userId: senderNumber });
      if (!senderUser || senderUser.role !== "True Owner") {
        return reply("❌ You don't have permission to do that");
      }

      const [allCards, users] = await Promise.all([
        Card.find({}),
        User.find({}, "cards"),
      ]);

      const activeSpawns = global.activeSpawns || {};
      const spawnedIds = Object.values(activeSpawns).map((spawn) => spawn.cardId);
      const ownedIds = new Set();
      users.forEach((user) => {
        (user.cards || []).forEach((card) => {
          if (card.cardId) ownedIds.add(card.cardId);
        });
      });

      const tierCounts = new Map();
      allCards.forEach((card) => {
        const tier = normalizeTier(card.tier);
        tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1);
      });

      const totalCards = allCards.length;
      const ownedCount = ownedIds.size;
      const unspawnedCount = allCards.filter(
        (card) => !ownedIds.has(card.cardId) && !spawnedIds.includes(card.cardId)
      ).length;
      const tiers = getTierKeys([...tierCounts.keys()]);

      const msg = generateWAMessageFromContent(
        jid,
        proto.Message.fromObject({
          pollResultSnapshotMessage: proto.Message.PollResultSnapshotMessage.fromObject({
            name: `🃏 CARD SYSTEM SNAPSHOT\n\n📦 TOTAL: ${totalCards}\n👥 CLAIMED: ${ownedCount}\n⚪ UNSPAWNED: ${unspawnedCount}`,
            pollVotes: [
              ...tiers.map((tier) => ({
                optionName: getTierLabel(tier).toUpperCase(),
                optionVoteCount: tierCounts.get(tier) || 0,
              })),
              { optionName: "🟢 SPAWNED", optionVoteCount: spawnedIds.length },
            ],
          }),
        }),
        { quoted: m }
      );

      return sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    } catch (err) {
      console.error("CARDS CMD ERROR:", err);
      return reply("❌ Failed to load card-system statistics.");
    }
  },
});
