// commands/Yugioh/yi.js
// ─────────────────────────────────────────────────────────────────────────────
// .yi <card name | card ID>
// Search for any official Yu-Gi-Oh card and view its info, rarity, description,
// and current owners in the Moonlight network.
// Data fetched live from the official YGOPRODeck API.
// ─────────────────────────────────────────────────────────────────────────────

const YugiohCard = require('../../models/yugioh/YugiohCard');
const { getCardById, searchCardByName, rarityEmoji, formatCardStats } = require('../../utils/yugiohApi');

moon({
  name: 'yi',
  aliases: ['yinfo', 'ylookup'],
  category: 'Yu-gi-oh',
  description: 'Search for a Yu-Gi-Oh card and view its info, rarity, and owners',
  usage: '.yi <card name | card ID>',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!args.length) return reply('❌ Usage: *.yi <card name or ID>*\nExample: `.yi Dark Magician` or `.yi 46986414`');

      const query = args.join(' ').trim();
      let card = null;

      // ── Try numeric ID first ──────────────────────────────────────────
      if (/^\d+$/.test(query)) {
        card = await getCardById(parseInt(query, 10));
      }

      // ── Fall back to name search ──────────────────────────────────────
      if (!card) {
        const results = await searchCardByName(query);
        if (!results.length) {
          return reply(`❌ No Yu-Gi-Oh card found matching *"${query}"*.\nTry a different name or use the exact card ID.`);
        }
        // If multiple results, show a list
        if (results.length > 1) {
          let list = `🔍 *Multiple cards found for "${query}":*\n\n`;
          results.slice(0, 8).forEach((c, i) => {
            list += `[${i + 1}] *${c.name}* — ${c.type}\n`;
          });
          list += `\nUse *.yi <exact name>* or *.yi <card ID>* for details.`;
          return reply(list);
        }
        card = results[0];
      }

      // ── Count owners in the network ───────────────────────────────────
      const ownerCount = await YugiohCard.countDocuments({ cardId: card.cardId });

      const emoji = rarityEmoji(card.rarity);
      const stats = formatCardStats(card);

      const text =
`┌─❖
│ 「 🃏 YU-GI-OH CARD INFO 」
└┬❖ 「 ${card.name} 」
   │
   │ 📋 *Type:* ${card.type || 'Unknown'}
   │ ${emoji} *Rarity:* ${card.rarity}
   │ 🆔 *Card ID:* ${card.cardId}
${stats ? stats.split('\n').map(l => `   │ ${l}`).join('\n') + '\n' : ''}   │
   │ 📖 *Description:*
   │ ${(card.desc || 'No description.').slice(0, 300)}${(card.desc || '').length > 300 ? '…' : ''}
   │
   │ 👥 *Owners in network:* ${ownerCount}
   └────────────┈ ⳹`;

      if (card.imageUrl) {
        return sock.sendMessage(jid, { image: { url: card.imageUrl }, caption: text }, { quoted: m });
      }
      return reply(text);
    } catch (err) {
      console.error('[YI ERROR]', err);
      return reply('❌ Failed to fetch card info. The YGOPRODeck API may be temporarily unavailable.');
    }
  }
});
