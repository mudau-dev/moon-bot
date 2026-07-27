// commands/Yugioh/t2ycol.js
// ─────────────────────────────────────────────────────────────────────────────
// .t2ycol <index>
// Moves a card between your collection and deck.
// Max deck size: 6 cards.
// ─────────────────────────────────────────────────────────────────────────────

const YugiohCard = require('../../models/yugioh/YugiohCard');

const MAX_DECK = 6;

moon({
  name: 't2ycol',
  category: 'Yu-gi-oh',
  description: 'Move a card between your collection and deck',
  usage: '.t2ycol <index>',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const idx = parseInt(args[0], 10);

      if (!idx || idx < 1) {
        return reply(
          `❌ Invalid index.\n\n` +
          `Usage: *.t2ycol <index>*\n` +
          `Use *.ycol* or *.ydeck* to view card indexes.`
        );
      }

      // Collection
      const colCards = await YugiohCard.find({
        ownerJid: sender,
        location: 'collection'
      })
        .sort({ obtainedAt: -1 })
        .lean();

      if (idx <= colCards.length) {
        const card = colCards[idx - 1];

        // Check deck size
        const deckCount = await YugiohCard.countDocuments({
          ownerJid: sender,
          location: 'deck'
        });

        if (deckCount >= MAX_DECK) {
          return reply(
            `❌ Your deck is full. (${MAX_DECK}/${MAX_DECK})\n` +
            `Remove a card from your deck before adding another.`
          );
        }

        // Find free deck slot
        const deckCards = await YugiohCard.find({
          ownerJid: sender,
          location: 'deck'
        }).lean();

        const usedSlots = new Set(deckCards.map(c => c.deckSlot));

        let freeSlot = 1;
        while (usedSlots.has(freeSlot)) freeSlot++;

        await YugiohCard.findByIdAndUpdate(card._id, {
          location: 'deck',
          deckSlot: freeSlot
        });

        return reply(
          `✅ Card added to your deck.\n\n` +
          `🃏 ${card.name}\n` +
          `📍 Slot: ${freeSlot}`
        );
      }

      // Deck
      const deckCards = await YugiohCard.find({
        ownerJid: sender,
        location: 'deck'
      })
        .sort({ deckSlot: 1 })
        .lean();

      const deckIdx = idx - colCards.length;

      if (deckIdx >= 1 && deckIdx <= deckCards.length) {
        const card = deckCards[deckIdx - 1];

        await YugiohCard.findByIdAndUpdate(card._id, {
          location: 'collection',
          deckSlot: null
        });

        return reply(
          `✅ Card returned to your collection.\n\n` +
          `🃏 ${card.name}`
        );
      }

      return reply(
        `❌ Card not found.\n` +
        `Check the index with *.ycol* or *.ydeck*.`
      );

    } catch (err) {
      console.error('[T2YCOL ERROR]', err);

      return reply(
        `❌ An error occurred while moving the card.`
      );
    }
  }
});