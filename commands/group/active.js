const Group = require('../../models/athers/Group');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

moon({
  name: "active",
  category: "group",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Check group activity stats",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const group = await Group.findOne({ groupId: jid });
      if (!group) return reply("❌ Activity data not found for this group.");

      const total = group.totalMessages || 0;
      const bot = group.botMessages || 0;
      const req = 250;
      const progress = Math.min(100, Math.floor((total / req) * 100));

      const msg = generateWAMessageFromContent(
        jid,
        proto.Message.fromObject({
          pollResultSnapshotMessage:
            proto.Message.PollResultSnapshotMessage.fromObject({
              name: `📊 *GROUP ACTIVITY - MOONLIGHT HAVEN*`,
              pollVotes: [
                {
                  optionName: "*Required messages*",
                  optionVoteCount: req
                },
                {
                  optionName: "*Normal messages*",
                  optionVoteCount: total
                },
                {
                  optionName: "*Bot commands used*",
                  optionVoteCount: bot
                },
                {
                  optionName: "*Spawn Progress*",
                  optionVoteCount: progress
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
