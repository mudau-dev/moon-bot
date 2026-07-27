const DEFAULT_SHOP = [
  { id: "1", name: "Cake", price: 900, emoji: "🍰", description: "A delicious cake. Tastes like victory!" },
  { id: "2", name: "Pistol", price: 790, emoji: "🔫", description: "A shiny pistol. Don't use it on friends." },
  { id: "3", name: "Lottery Ticket", price: 1500, emoji: "🎟️", description: "Join the current lottery pool for a big win!" },
  { id: "4", name: "Shovel", price: 1200, emoji: "📝", description: "Useful for digging things up." },
  { id: "5", name: "Fishing Rod", price: 2500, emoji: "🎣", description: "Catch some fish in the pond!" }
];

moon({
  name: "item",
  category: "shop",
  description: "Get info about an item",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const query = args.join(" ").toLowerCase();
      if (!query) return reply("❓ Usage: .item <name/id>");

      const item = DEFAULT_SHOP.find(i => i.name.toLowerCase().includes(query) || i.id === query);
      if (!item) return reply("❌ Item not found.");

      return reply(`📦 *ITEM INFO*\n\n*Name:* ${item.name}\n*Price:* ${item.price.toLocaleString()}\n*ID:* ${item.id}\n\n*Description:* ${item.description}`);
    } catch (err) {
      console.error(err);
      return reply("❌ Error loading item info.");
    }
  }
});
