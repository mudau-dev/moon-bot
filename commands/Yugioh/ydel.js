// commands/Yugioh/ydel.js
// ─────────────────────────────────────────────────────────────────────────────
// .ydel <collection index>
// Permanently delete a card from your collection.
// ─────────────────────────────────────────────────────────────────────────────

const YugiohCard = require('../../models/yugioh/YugiohCard');

// Pending confirmations
const pendingDeletes = new Map();

moon({
  name: 'ydel',
  category: 'Yu-gi-oh',
  description: 'Permanently delete a card from your collection',
  usage: '.ydel <collection index>',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      // Confirm deletion
      if (args[0]?.toLowerCase() === 'yes') {
        const pending = pendingDeletes.get(sender);

        if (!pending || Date.now() > pending.expiresAt) {
          pendingDeletes.delete(sender);

          return reply(
            `❌ No pending deletion found.\n` +
            `Use *.ydel <index>* again.`
          );
        }

        await YugiohCard.findByIdAndDelete(pending.docId);
        pendingDeletes.delete(sender);

        return reply(
          `✅ Card deleted.\n\n` +
          `🃏 ${pending.cardName}`
        );
      }

      // Cancel deletion
      if (args[0]?.toLowerCase() === 'no') {
        pendingDeletes.delete(sender);

        return reply(
          `✅ Deletion cancelled.`
        );
      }

      // Get card index
      const idx = parseInt(args[0], 10);

      if (!idx || idx < 1) {
        return reply(
          `❌ Invalid index.\n\n` +
          `Usage: *.ydel <collection index>*\n` +
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

      // Save pending confirmation
      pendingDeletes.set(sender, {
        docId: card._id,
        cardName: card.name,
        expiresAt: Date.now() + 30000
      });

      return reply(
        `⚠️ Delete this card?\n\n` +
        `🃏 ${card.name}\n\n` +
        `Reply with:\n` +
        `• *.ydel yes* — Confirm\n` +
        `• *.ydel no* — Cancel\n\n` +
        `This request expires in 30 seconds.`
      );

    } catch (err) {
      console.error('[YDEL ERROR]', err);

      return reply(
        `❌ Failed to delete the card.`
      );
    }
  }
});