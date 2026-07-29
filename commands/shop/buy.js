const { findOrCreateWhatsApp, userCache } = require('../../database/users');
const User = require('../../models/User');
const LegacyPlayer = require('../../models/LegacyPlayer');

const DEFAULT_SHOP = [
  { id: "1", name: "Cake", price: 900, emoji: "🍰" },
  { id: "2", name: "Pistol", price: 790, emoji: "🔫" },
  { id: "3", name: "Lottery Ticket", price: 1500, emoji: "🎟️" },
  { id: "4", name: "Shovel", price: 1200, emoji: "📝" },
  { id: "5", name: "Fishing Rod", price: 2500, emoji: "🎣" },
  { id: "6", name: "Manas (x100)", price: 2500, emoji: "🌙", isManas: true, manasAmount: 100 },
  { id: "7", name: "Guild License", price: 10000000, emoji: "🏰", isGuildLicense: true }
];

moon({
  name: "buy",
  category: "shop",
  description: "Buy an item from the shop",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const index = parseInt(args[0]) - 1;
      if (isNaN(index) || !DEFAULT_SHOP[index]) return reply("❓ Usage: .buy <index>");

      const userDoc = await findOrCreateWhatsApp(sender);
      if (!userDoc) return reply("❌ User not found.");
      
      const user = userDoc.toObject();
      const item = DEFAULT_SHOP[index];

      if (user.balance < item.price) return reply(`💰 You need ${(item.price - user.balance).toLocaleString()} more coins!`);

      const updateOp = {
        $inc: { balance: -item.price }
      };

      if (item.isManas) {
        updateOp.$inc.manas = item.manasAmount;
      } else if (item.isGuildLicense) {
        updateOp.$set = { guildLicense: true };
      } else {
        const newItem = {
          id: item.id,
          name: item.name,
          emoji: item.emoji,
          boughtAt: new Date()
        };
        updateOp.$push = { inventory: newItem };
      }

      await User.updateOne({ _id: userDoc._id }, updateOp);
      
      // Sync with LegacyPlayer if it's manas
      if (item.isManas) {
        const legacy = await LegacyPlayer.findOne({
          $or: [
            { whatsappId: user.whatsappNumber },
            { whatsappId: user.moonId },
            { whatsappId: user.userId }
          ]
        });

        if (legacy) {
          legacy.mana = Math.min(
            legacy.maxMana,
            (legacy.mana || 0) + item.manasAmount
          );
          await legacy.save();
        }
      }

      if (userCache) { 
        userCache.delete(sender); 
        if (user.userId) userCache.delete(user.userId);
        if (user.moonId) userCache.delete(user.moonId);
      }

      return reply(`✅ You have bought *${item.name}* for ${item.price.toLocaleString()} coins!${item.isManas ? " Your manas have been added to your balance." : ""}`);
    } catch (err) {
      console.error(err);
      return reply("❌ Error buying item.");
    }
  }
});
