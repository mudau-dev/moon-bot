// commands/Yugioh/yswap.js
// ─────────────────────────────────────────────────────────────────────────────
// .ydswap <i> <j>  — Swap two cards in your deck.
// .yswap <i> <j>   — Swap two cards in your collection.
// ─────────────────────────────────────────────────────────────────────────────

const YugiohCard = require('../../models/yugioh/YugiohCard');

// ─────────────────────────────────────────────────────────────────────────────
// .ydswap
// ─────────────────────────────────────────────────────────────────────────────

moon({
  name: 'ydswap',
  category: 'Yu-gi-oh',
  description: 'Swap two cards in your deck',
  usage: '.ydswap <slot 1> <slot 2>',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const i = parseInt(args[0], 10);
      const j = parseInt(args[1], 10);

      if (!i || !j || i < 1 || j < 1 || i === j) {
        return reply(
          `❌ Invalid usage.\n\n` +
          `Example: *.ydswap 1 3*`
        );
      }

      const deckCards = await YugiohCard.find({
        ownerJid: sender,
        location: 'deck'
      })
        .sort({ deckSlot: 1 })
        .lean();

      const cardA = deckCards[i - 1];
      const cardB = deckCards[j - 1];

      if (!cardA) {
        return reply(`❌ No card in deck slot *${i}*.`);
      }

      if (!cardB) {
        return reply(`❌ No card in deck slot *${j}*.`);
      }

      const slotA = cardA.deckSlot;
      const slotB = cardB.deckSlot;

      await Promise.all([
        YugiohCard.findByIdAndUpdate(cardA._id, {
          deckSlot: slotB
        }),
        YugiohCard.findByIdAndUpdate(cardB._id, {
          deckSlot: slotA
        })
      ]);

      return reply(
        `✅ Deck updated.\n\n` +
        `${i}. ${cardB.name}\n` +
        `${j}. ${cardA.name}`
      );

    } catch (err) {
      console.error('[YDSWAP ERROR]', err);

      return reply(
        `❌ Failed to swap deck cards.`
      );
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// .yswap
// ─────────────────────────────────────────────────────────────────────────────

moon({
  name: 'yswap',
  category: 'Yu-gi-oh',
  description: 'Swap two cards in your collection',
  usage: '.yswap <index 1> <index 2>',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const i = parseInt(args[0], 10);
      const j = parseInt(args[1], 10);

      if (!i || !j || i < 1 || j < 1 || i === j) {
        return reply(
          `❌ Invalid usage.\n\n` +
          `Example: *.yswap 2 5*`
        );
      }

      const colCards = await YugiohCard.find({
        ownerJid: sender,
        location: 'collection'
      })
        .sort({ obtainedAt: -1 })
        .lean();

      const cardA = colCards[i - 1];
      const cardB = colCards[j - 1];

      if (!cardA) {
        return reply(`❌ No card at collection index *${i}*.`);
      }

      if (!cardB) {
        return reply(`❌ No card at collection index *${j}*.`);
      }

      const timeA = cardA.obtainedAt;
      const timeB = cardB.obtainedAt;

      await Promise.all([
        YugiohCard.findByIdAndUpdate(cardA._id, {
          obtainedAt: timeB
        }),
        YugiohCard.findByIdAndUpdate(cardB._id, {
          obtainedAt: timeA
        })
      ]);

      return reply(
        `✅ Collection updated.\n\n` +
        `${i}. ${cardB.name}\n` +
        `${j}. ${cardA.name}`
      );

    } catch (err) {
      console.error('[YSWAP ERROR]', err);

      return reply(
        `❌ Failed to swap collection cards.`
      );
    }
  }
});