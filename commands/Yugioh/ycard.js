// commands/Yugioh/ycard.js
// ─────────────────────────────────────────────────────────────────────────────
// .ycard <collection index>
// View detailed information about one of your cards.
// ─────────────────────────────────────────────────────────────────────────────

const YugiohCard = require('../../models/yugioh/YugiohCard');
const { rarityEmoji, formatCardStats } = require('../../utils/yugiohApi');

moon({
  name: 'ycard',
  category: 'Yu-gi-oh',
  description: 'View detailed information about one of your cards',
  usage: '.ycard <collection index>',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const idx = parseInt(args[0], 10);

      if (!idx || idx < 1) {
        return reply(
          `❌ Invalid index.\n\n` +
          `Usage: *.ycard <collection index>*\n` +
          `Use *.ycol* to view your collection.`
        );
      }

      const colCards = await YugiohCard.find({
        ownerJid: sender,
        location: 'collection'
      })
        .sort({ obtainedAt: -1 })
        .lean();

      const card = colCards[idx - 1];

      if (!card) {
        return reply(
          `❌ Card not found.\n` +
          `You have *${colCards.length}* card(s) in your collection.`
        );
      }

      const emoji = rarityEmoji(card.rarity);
      const stats = formatCardStats(card);

      const obtained = card.obtainedAt
        ? new Date(card.obtainedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : 'Unknown';

      const text =
`🃏 *${card.name}*

${emoji} *Rarity:* *${card.rarity}*
📋 *Type:* *${card.type || 'Unknown'}*
🆔 *Card ID:* *${card.cardId}*

${stats ? stats + '\n\n' : ''}📖 *Description*
${(card.desc || 'No description available.').slice(0, 200)}${(card.desc || '').length > 200 ? '…' : ''}

📅 *Obtained:* ${obtained}`;

      if (card.imageUrl) {
        return sock.sendMessage(
          jid,
          {
            image: { url: card.imageUrl },
            caption: text
          },
          { quoted: m }
        );
      }

      return reply(text);

    } catch (err) {
      console.error('[YCARD ERROR]', err);

      return reply(
        `❌ Failed to load card details.`
      );
    }
  }
});