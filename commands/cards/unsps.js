const Card = require("../../models/Card");
const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");
const {
  getTierKeys,
  getTierLabel,
  normalizeTier,
} = require("../../utils/cardGenerator");

moon({
  name: "unsps",
  category: "Cards",
  description: "Shows unspawned saved-card counts per tier",

  async execute(sock, jid, sender, args, m) {
    try {
      const activeSpawns = global.activeSpawns || {};
      const activeIds = Object.values(activeSpawns)
        .map((spawn) => spawn?.cardId)
        .filter(Boolean);

      const results = await Card.aggregate([
        { $match: { cardId: { $nin: activeIds } } },
        { $group: { _id: "$tier", count: { $sum: 1 } } },
      ]);

      const counts = new Map();
      results.forEach((entry) => {
        const tier = normalizeTier(entry._id);
        counts.set(tier, (counts.get(tier) || 0) + entry.count);
      });

      const tiers = getTierKeys([...counts.keys()]);
      const message = generateWAMessageFromContent(
        jid,
        proto.Message.fromObject({
          pollResultSnapshotMessage: proto.Message.PollResultSnapshotMessage.fromObject({
            name: "🃏 UNSPAWNED SAVED CARDS BY TIER",
            pollVotes: tiers.map((tier) => ({
              optionName: getTierLabel(tier).toUpperCase(),
              optionVoteCount: counts.get(tier) || 0,
            })),
          }),
        }),
        { quoted: m }
      );

      return sock.relayMessage(jid, message.message, { messageId: message.key.id });
    } catch (err) {
      console.error("UNSPS ERROR:", err);
    }
  },
});
