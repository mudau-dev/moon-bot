// commands/Yugioh/ycol.js
// ─────────────────────────────────────────────────────────────────────────────
// .ycol / .ycoll
// View your Yu-Gi-Oh collection.
// Cards in your deck are not shown here.
// ─────────────────────────────────────────────────────────────────────────────

const YugiohCard = require('../../models/yugioh/YugiohCard');
const { rarityEmoji } = require('../../utils/yugiohApi');

const PAGE_SIZE = 15;

moon({
  name: 'ycol',
  aliases: ['ycoll'],
  category: 'Yu-gi-oh',
  description: 'View your Yu-Gi-Oh card collection',
  usage: '.ycol [page]',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const page = Math.max(1, parseInt(args[0], 10) || 1);
      const skip = (page - 1) * PAGE_SIZE;

      const [cards, total] = await Promise.all([
        YugiohCard.find({
          ownerJid: sender,
          location: 'collection'
        })
          .sort({ obtainedAt: -1 })
          .skip(skip)
          .limit(PAGE_SIZE)
          .lean(),

        YugiohCard.countDocuments({
          ownerJid: sender,
          location: 'collection'
        }),
      ]);

      if (!total) {
        return reply(
          `📭 Your Yu-Gi-Oh collection is empty.\n\n` +
          `Use *.yspawn* to spawn cards and *.yclaim* to collect them.`
        );
      }

      const totalPages = Math.ceil(total / PAGE_SIZE);

      let text =
`🃏 *Your Collection*

📦 yuCards: *${total}*
📄 Page: *${page}/${totalPages}*

`;

      cards.forEach((card, i) => {
        const index = skip + i + 1;
        const emoji = rarityEmoji(card.rarity);

        text += `${index}. *${card.name}*\n`;
        text += `> ${card.type || 'Unknown'} • \`${card.rarity}\`\n\n`;
      });

      text +=
`📖 \`.ycard <index>\` — View card details. \`.t2ycol <index>\` — Add card to your deck`;

      return reply(text);

    } catch (err) {
      console.error('[YCOL ERROR]', err);

      return reply(
        `❌ Failed to load your collection.`
      );
    }
  }
});