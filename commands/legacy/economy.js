const { findLegacyPlayer } = require('../../utils/legacyUtils');
/**
 * commands/legacy/economy.js
 * .market | .purchase | .consume | .inventory
 */
const LegacyPlayer = require('../../models/LegacyPlayer');

const ITEMS = {
  'hp_potion': { name: 'HP Potion', price: 100, desc: 'Restores 50 HP', effect: (p) => { p.hp = Math.min(p.maxHp, p.hp + 50); } },
  'mana_potion': { name: 'Mana Potion', price: 100, desc: 'Restores 50 Mana', effect: (p) => { p.mana = Math.min(p.maxMana, p.mana + 50); } },
  'elixir': { name: 'Elixir', price: 500, desc: 'Restores 100 HP & 100 Mana', effect: (p) => { p.hp = Math.min(p.maxHp, p.hp + 100); p.mana = Math.min(p.maxMana, p.mana + 100); } },
  'strength_charm': { name: 'Strength Charm', price: 1000, desc: 'Permanently +5 ATK', effect: (p) => { p.attack += 5; } },
  'defense_charm': { name: 'Defense Charm', price: 1000, desc: 'Permanently +5 DEF', effect: (p) => { p.defense += 5; } },
};

moon({
  name: 'market',
  aliases: ['shop'],
  category: 'legacy',
  description: 'Open the Legacy marketplace',
  async execute(sock, jid, sender, args, m, { reply }) {
    const list = Object.entries(ITEMS).map(([id, item]) => 
      `🛒 *${item.name}* (${id})\n   💰 Price: ${item.price} Gold\n   📜 ${item.desc}`
    ).join('\n\n');
    return reply(`🏪 *MOONLIGHT MARKET*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n${list}\n\n> Use *.purchase <item_id>* to buy.`);
  }
});

moon({
  name: 'purchase',
  aliases: ['buy'],
  category: 'legacy',
  description: 'Buy an item from the market',
  async execute(sock, jid, sender, args, m, { reply }) {
    const itemId = (args[0] || '').toLowerCase();
    const item = ITEMS[itemId];
    if (!item) return reply('❌ Item not found. Check *.market* for IDs.');

    const player = await findLegacyPlayer(sender);
    if (!player) return reply('❌ No Legacy account. Use *.genesis*.');
    if (player.gold < item.price) return reply(`❌ Not enough gold! (Need ${item.price}, have ${player.gold})`);

    player.gold -= item.price;
    const invItem = player.inventory.find(i => i.id === itemId);
    if (invItem) {
      invItem.qty += 1;
    } else {
      player.inventory.push({ id: itemId, name: item.name, qty: 1 });
    }
    await player.save();
    return reply(`✅ Purchased *${item.name}* for ${item.price} Gold!`);
  }
});

moon({
  name: 'linventory',
  aliases: ['linv'],
  category: 'legacy',
  description: 'View your items',
  async execute(sock, jid, sender, args, m, { reply }) {
    const player = await findLegacyPlayer(sender).lean();
    if (!player) return reply('❌ No Legacy account. Use *.genesis*.');

    if (!player.inventory || !player.inventory.length) {
      return reply('🎒 Your inventory is empty.');
    }

    const list = player.inventory.map(i => `• *${i.name}* (x${i.qty})  - ID: \`${i.id}\``).join('\n');
    return reply(`🎒 *${player.name}'s Inventory*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n${list}\n\n> Use *.consume <item_id>* to use an item.`);
  }
});

moon({
  name: 'consume',
  aliases: ['useitem'],
  category: 'legacy',
  description: 'Use a consumable item',
  async execute(sock, jid, sender, args, m, { reply }) {
    const itemId = (args[0] || '').toLowerCase();
    const player = await findLegacyPlayer(sender);
    if (!player) return reply('❌ No Legacy account. Use *.genesis*.');

    const invIdx = player.inventory.findIndex(i => i.id === itemId);
    if (invIdx === -1) return reply('❌ You don\'t have this item.');

    const item = ITEMS[itemId];
    if (!item) return reply('❌ Item data error.');

    item.effect(player);
    player.inventory[invIdx].qty -= 1;
    if (player.inventory[invIdx].qty <= 0) {
      player.inventory.splice(invIdx, 1);
    }
    
    await player.save();
    return reply(`✨ Used *${item.name}*!\n${item.desc}`);
  }
});
