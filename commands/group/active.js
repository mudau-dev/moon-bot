const Group = require('../../models/athers/Group');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

moon({
  name: "active",
  category: "group",
  description: "Check group activity stats",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      let group = await Group.findOne({ groupId: jid });
      if (!group) {
        group = await Group.create({ groupId: jid });
      }

      const total = group.totalMessages || 0;
      const bot = group.botMessages || 0;
      const req = 250;
      const progress = Math.min(100, Math.floor((total / req) * 100));
      const spawnedCount = group.cardsSpawnedThisCycle || 0;

      // Check if threshold reached to spawn card
      if (total >= req) {
        const { spawnCard } = require('../../handler/CardsSystem');
        // Manually trigger a spawn attempt
        await spawnCard(sock, jid);
        
        // Fetch updated group data after spawn logic
        group = await Group.findOne({ groupId: jid });
      }

      const msg = generateWAMessageFromContent(
        jid,
        proto.Message.fromObject({
          pollResultSnapshotMessage:
            proto.Message.PollResultSnapshotMessage.fromObject({
              name: `📊 *GROUP ACTIVITY - MOONLIGHT HAVEN*`,
              pollVotes: [
                {
                  optionName: `*Spawns: ${group.cardsSpawnedThisCycle}/10*`,
                  optionVoteCount: group.cardsSpawnedThisCycle
                },
                {
                  optionName: "*Required messages*",
                  optionVoteCount: req
                },
                {
                  optionName: "*Normal messages*",
                  optionVoteCount: group.totalMessages
                },
                {
                  optionName: "*Bot commands used*",
                  optionVoteCount: group.botMessages
                },
                {
                  optionName: "*Spawn Progress*",
                  optionVoteCount: Math.min(100, Math.floor((group.totalMessages / req) * 100))
                }
              ]
            })
        }),
        { quoted: m }
      );

      await sock.relayMessage(jid, msg.message, {
        messageId: msg.key.id
      });
    } catch (err) {
      console.error("ACTIVE CMD ERROR:", err);
      return reply("❌ Error fetching activity.");
    }
  }
});
