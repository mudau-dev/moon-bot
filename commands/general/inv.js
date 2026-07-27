// updated by manus\nconst User = require('../../models/User');
moon({
  name: 'inv',
  aliases: ['inventory'],
  category: 'general',
  description: 'See your inventory',
  execute: async (sock, jid, sender, args, m, { reply }) => {
    try {
      const user = await User.findOne({ whatsappNumber: sender });
      if (!user || !user.inventory || user.inventory.length === 0) return reply("🎒 Your inventory is empty.");
      const counts = {};
      user.inventory.forEach(item => { counts[item] = (counts[item] || 0) + 1; });
      let text = "🎒 Your *Inventory* 📦\n\n";
      const itemNames = Object.keys(counts);
      const emojiMap = { 'Fishing Rod': '🎣', 'Pistol': '🔫', 'Shovel': '📝', 'Debit Card': '💳', 'Lottery': '🎫', 'Golden Fish': '🪙🐟' };
      itemNames.forEach((name, index) => {
        const emoji = emojiMap[name] || '📦';
        text += `*${index + 1}. ${emoji} ${name}* — x${counts[name]}\n`;
      });
      return reply(text);
    } catch (err) { return reply("❌ Failed to fetch inventory."); }
  }
});
