const Lottery = require('../../models/athers/Lottery');
const User = require('../../models/User');

moon({
  name: "lottery",
  category: "economy",
  description: "Join the lottery using a ticket from the shop!",

  async execute(sock, jid, sender, args, m, { reply, findOrCreateWhatsApp }) {
    try {
      const MAX_ENTRIES_PER_USER = 3;
      const MAX_PARTICIPANTS = 7;
      const PRIZE_POOL = 1000000; // 1M total prize

      const userId = sender.split('@')[0];
      const user = await User.findOne({ userId });

      if (!user) return reply("❌ User not found.");

      // Check if user has a Lottery Ticket in inventory
      const ticketIndex = user.inventory ? user.inventory.findIndex(item => item.name.toLowerCase().includes("lottery ticket")) : -1;
      
      if (ticketIndex === -1) {
        return reply("❌ You need a *Lottery Ticket* to join the lottery!\n🛒 Buy one at the `.shop` for 1,500 coins.");
      }

      // Load or Create Lottery
      let lottery = await Lottery.findOne({ active: true });
      if (!lottery) {
        lottery = new Lottery({ active: true, participants: [] });
      }

      // Check entry limits
      let participant = lottery.participants.find(p => p.userId === sender);
      if (participant) {
        if (participant.entries >= MAX_ENTRIES_PER_USER) {
          return reply(`❌ You have already joined 3 times this round! Wait for the next draw.`);
        }
        participant.entries += 1;
      } else {
        if (lottery.participants.length >= MAX_PARTICIPANTS) {
          return reply("❌ The current lottery pool is full (7/7 participants). Please wait for the draw!");
        }
        lottery.participants.push({ userId: sender, entries: 1 });
      }

      // Consume the ticket (Remove from inventory)
      const updatedInventory = [...user.inventory];
      updatedInventory.splice(ticketIndex, 1);

      await User.updateOne({ userId }, { $set: { inventory: updatedInventory } });
      await lottery.save();

      const totalParticipants = lottery.participants.length;
      reply(`🎉 You have used you *lottery ticket* and joined the global lottery 
> Your joined ${participant ? participant.entries : 1} .the current Participants: ${totalParticipants}/${MAX_PARTICIPANTS}`);

      // Auto-draw if max participants reached
      if (totalParticipants >= MAX_PARTICIPANTS) {
        await drawLottery(lottery, sock, jid, m);
      }

      async function drawLottery(activeLottery, sock, jid, m) {
        let pool = [];
        activeLottery.participants.forEach(p => {
          for (let i = 0; i < p.entries; i++) {
            pool.push(p.userId);
          }
        });

        // Shuffle pool
        pool = pool.sort(() => Math.random() - 0.5);
        
        const winner1 = pool[0];
        const winner2 = pool.find(id => id !== winner1) || pool[1];
        
        const firstPrize = Math.floor(PRIZE_POOL * 0.7);
        const secondPrize = Math.floor(PRIZE_POOL * 0.3);

        if (winner1) {
          await User.updateOne({ userId: winner1.split('@')[0] }, { $inc: { balance: firstPrize } });
        }
        if (winner2) {
          await User.updateOne({ userId: winner2.split('@')[0] }, { $inc: { balance: secondPrize } });
        }

        const results = `🏆 *LOTTERY RESULTS* 🏆
━━━━━━━━━━━━━━━━━━━━━━
🥇 @${winner1.split('@')[0]} → $${firstPrize.toLocaleString()}!
🥈 @${winner2.split('@')[0]} → $${secondPrize.toLocaleString()}!
━━━━━━━━━━━━━━━━━━━━━━
🎉 Winners selected automatically. Buy a ticket for the next round!`;

        await sock.sendMessage(jid, {
          text: results,
          mentions: [winner1, winner2]
        }, { quoted: m });

        // Reset lottery
        activeLottery.participants = [];
        await activeLottery.save();
      }

    } catch (err) {
      console.error("lottery error:", err);
      reply("❌ Lottery failed.");
    }
  }
});
