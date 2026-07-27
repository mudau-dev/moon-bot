const config = require('../../config');
const Lottery = require('../../models/athers/Lottery');
const User = require('../../models/User');
const {
  generateWAMessageFromContent,
  proto
} = require('@whiskeysockets/baileys');

moon({
  name: "ll",
  category: "economy",
  description: "Lottery status / draw",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const sub = (args[0] || "").toLowerCase();
      const REQUIRED = 7; // Updated from 5 to 7

      // ================= DRAW =================
      if (sub === "draw") {
        const senderNumber = sender.split('@')[0];
        if (!(config.OWNER_NUMBERS || []).includes(senderNumber)) {
          return reply("You cant use that.");
        }
        const lottery = await Lottery.findOne({ active: true });
        if (!lottery) return reply("❌ No active lottery.");
        
        const participants = Array.isArray(lottery.participants)
          ? lottery.participants.filter(p => p && p.userId && p.entries > 0)
          : [];
          
        const totalEntries = participants.reduce(
          (sum, p) => sum + (p.entries || 0),
          0
        );
        
        if (totalEntries < REQUIRED) {
          return reply(`❌ Need at least ${REQUIRED} entries.`);
        }
        
        let pool = [];
        for (const p of participants) {
          for (let i = 0; i < p.entries; i++) {
            pool.push(p.userId);
          }
        }
        
        const winnerId = pool[Math.floor(Math.random() * pool.length)];
        const winner = await User.findOne({ userId: winnerId.split('@')[0] });
        if (!winner) return reply("❌ Winner not found.");
        
        const reward = 1000000; // Updated to match lottery.js prize pool
        winner.balance += reward;
        await winner.save();
        
        lottery.active = false;
        lottery.participants = [];
        lottery.prize = 0;
        await lottery.save();
        
        return sock.sendMessage(jid, {
          text: `🎉 *LOTTERY DRAW*\n🏆 Winner: @${winnerId.split('@')[0]}\n💰 Prize: ${reward.toLocaleString()} coins\n🎟️ Entries: ${totalEntries}`,
          mentions: [winnerId]
        }, { quoted: m });
      }

      // ================= STATUS =================
      const lottery = await Lottery.findOne({ active: true });
      if (!lottery) {
        return reply(`🎟️ *LOTTERY STATUS*\n❌ No active lottery`);
      }
      
      const participants = Array.isArray(lottery.participants)
        ? lottery.participants.filter(p => p && p.userId)
        : [];
        
      const totalEntries = participants.length; // Count unique participants
      
      const msg = generateWAMessageFromContent(
        jid,
        proto.Message.fromObject({
          pollResultSnapshotMessage:
            proto.Message.PollResultSnapshotMessage.fromObject({
              name: `🎟️ *Lottery Pools in MOONLIGHT HAVEN*`,
              pollVotes: [
                {
                  optionName: "*required*",
                  optionVoteCount: REQUIRED
                },
                {
                  optionName: "*participants*",
                  optionVoteCount: totalEntries
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
      console.error("LL ERROR:", err);
      return reply("❌ Lottery error.");
    }
  }
});
