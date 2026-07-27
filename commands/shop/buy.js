const { findOrCreateWhatsApp, userCache } = require('../../database/users');
const User = require('../../models/User');

const DEFAULT_SHOP = [
  { id: "1", name: "Cake", price: 900, emoji: "🍰" },
  { id: "2", name: "Pistol", price: 790, emoji: "🔫" },
  { id: "3", name: "Lottery Ticket", price: 1500, emoji: "🎟️" },
  { id: "4", name: "Shovel", price: 1200, emoji: "📝" },
  { id: "5", name: "Fishing Rod", price: 2500, emoji: "🎣" }
];

moon({
  name: "buy",
  category: "shop",
  description: "Buy an item from the shop",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const index = parseInt(args[0]) - 1;
      if (isNaN(index) || !DEFAULT_SHOP[index]) return reply("❓ Usage: .buy <index>");

      const userId = sender.split('@')[0];
      const user = await User.findOne({ userId });
      const item = DEFAULT_SHOP[index];

      if (user.balance < item.price) return reply(`💰 You need ${item.price - user.balance} more coins!`);

      const newItem = {
        id: item.id,
        name: item.name,
        emoji: item.emoji,
        boughtAt: new Date()
      };

      await User.updateOne({ userId }, {
        $inc: { balance: -item.price },
        $push: { inventory: newItem }
      });
      if (userCache) { userCache.delete(sender); userCache.delete(userId); }

      return reply(`✅ You have bought a *${item.name}* for ${item.price.toLocaleString()} coins!`);
    } catch (err) {
      console.error(err);
      return reply("❌ Error buying item.");
    }
  }
});
