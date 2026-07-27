// commands/Yugioh/ydeck.js
// ─────────────────────────────────────────────────────────────────────────────
// .ydeck
// View your current Yu-Gi-Oh deck (max 6 cards).
// ─────────────────────────────────────────────────────────────────────────────

const YugiohCard = require('../../models/yugioh/YugiohCard');
const { rarityEmoji } = require('../../utils/yugiohApi');

const MAX_DECK = 6;

moon({
  name: 'ydeck',
  category: 'Yu-gi-oh',
  description: 'View your current Yu-Gi-Oh deck',
  usage: '.ydeck',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const deck = await YugiohCard.find({
        ownerJid: sender,
        location: 'deck'
      })
        .sort({ deckSlot: 1 })
        .lean();

      if (!deck.length) {
        return reply(
          `📭 Your deck is empty.\n` +
          `> *TIP:* Use \`.t2ycol <index>\` to add cards from your collection.`
        );
      }

      let text =
`⚔️ *Your Deck*
🃏 *Cards:* *${deck.length}/${MAX_DECK}*

`;

      for (let i = 0; i < MAX_DECK; i++) {
        const card = deck.find(c => c.deckSlot === i + 1);

        if (!card) {
          text += `*${i + 1}.* Empty Slot\n\n`;
          continue;
        }

        const emoji = rarityEmoji(card.rarity);

        text += `${i + 1}. *${card.name}*\n`;
        text += `*┗⊱* ${card.type || 'Unknown'} • *${card.rarity}*`;

        if (card.atk != null) {
          text += ` • ⚔️ ${card.atk}`;
        }

        if (card.def != null) {
          text += ` • 🛡️ ${card.def}`;
        }

        text += `\n\n`;
      }

      text +=
`> 🎴 *.t2ycol <index>* — Add or remove cards and *.ydswap <slot1> <slot2>* — Swap deck slots`;

      return reply(text);

    } catch (err) {
      console.error('[YDECK ERROR]', err);

      return reply(
        `❌ Failed to load your deck.`
      );
    }
  }
});