// commands/Yugioh/yg.js
// ─────────────────────────────────────────────────────────────────────────────
// .yg <collection index> <price>
// .yg yes
// .yg no
// Sell a Yu-Gi-Oh card to another player.
// ─────────────────────────────────────────────────────────────────────────────

const { findOrCreateWhatsApp } = require('../../database/users');
const YugiohCard = require('../../models/yugioh/YugiohCard');
const YugiohTrade = require('../../models/yugioh/YugiohTrade');
const { rarityEmoji } = require('../../utils/yugiohApi');

moon({
  name: 'yg',
  aliases: ['ysell'],
  category: 'Yu-gi-oh',
  description: 'Offer one of your Yu-Gi-Oh cards for sale',
  usage: '.yg <collection index> <price>',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith('@g.us')) {
        return reply('❌ This command can only be used in groups.');
      }

      const sub = (args[0] || '').toLowerCase();

      // Accept offer
      if (sub === 'yes') {
        const offer = await YugiohTrade.findOne({
          toJid: sender,
          type: 'sale',
          status: 'pending'
        }).sort({ createdAt: -1 });

        if (!offer) {
          return reply('❌ You have no pending sale offers.');
        }

        const buyer = await findOrCreateWhatsApp(sender);

        if ((buyer.balance || 0) < offer.price) {
          return reply(
            `❌ You don't have enough coins.\n` +
            `Required: *${offer.price.toLocaleString()}*`
          );
        }

        const card = await YugiohCard.findById(offer.fromCardId);

        if (!card || card.ownerJid !== offer.fromJid) {
          await YugiohTrade.findByIdAndUpdate(offer._id, {
            status: 'expired'
          });

          return reply(
            `❌ This card is no longer available.`
          );
        }

        buyer.balance -= offer.price;
        await buyer.save();

        const seller = await findOrCreateWhatsApp(offer.fromJid);
        seller.balance = (seller.balance || 0) + offer.price;
        await seller.save();

        await YugiohCard.findByIdAndUpdate(offer.fromCardId, {
          ownerJid: sender,
          location: 'collection',
          deckSlot: null
        });

        await YugiohTrade.findByIdAndUpdate(offer._id, {
          status: 'accepted'
        });

        return reply(
          `✅ Purchase complete!\n\n` +
          `🃏 ${offer.fromCardName}\n` +
          `💰 ${offer.price.toLocaleString()} coins`,
          { mentions: [sender, offer.fromJid] }
        );
      }

      // Decline offer
      if (sub === 'no') {
        const offer = await YugiohTrade.findOne({
          toJid: sender,
          type: 'sale',
          status: 'pending'
        }).sort({ createdAt: -1 });

        if (!offer) {
          return reply('❌ You have no pending sale offers.');
        }

        await YugiohTrade.findByIdAndUpdate(offer._id, {
          status: 'declined'
        });

        return reply(
          `✅ Sale offer declined.`
        );
      }

      // Create offer
      const idx = parseInt(args[0], 10);
      const price = parseInt(args[1], 10);

      if (!idx || idx < 1 || !price || price < 1) {
        return reply(
          `❌ Invalid usage.\n\n` +
          `Example: *.yg 3 5000*`
        );
      }

      const ctx = m.message?.extendedTextMessage?.contextInfo || {};
      const mentions = ctx.mentionedJid || [];
      const quoted = ctx.participant || ctx.remoteJid;
      const buyerJid = mentions[0] || (quoted !== sender ? quoted : null);

      if (!buyerJid) {
        return reply(
          `❌ Tag or reply to the player you want to sell the card to.`
        );
      }

      if (buyerJid === sender) {
        return reply(
          `❌ You can't sell a card to yourself.`
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
          `❌ Card not found.`
        );
      }

      await YugiohTrade.deleteMany({
        fromCardId: card._id,
        status: 'pending'
      });

      await YugiohTrade.create({
        type: 'sale',
        fromJid: sender,
        fromCardId: card._id,
        fromCardName: card.name,
        toJid: buyerJid,
        price,
        groupJid: jid
      });

      const emoji = rarityEmoji(card.rarity);

      return sock.sendMessage(
        jid,
        {
          text:
`💰 *Card Sale Offer*

Seller: @${sender.split('@')[0]}

🃏 ${emoji} ${card.name}
💵 Price: ${price.toLocaleString()} coins

@${buyerJid.split('@')[0]}

Reply with:
• *.yg yes* — Buy
• *.yg no* — Decline`,
          mentions: [sender, buyerJid]
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('[YG ERROR]', err);

      return reply(
        `❌ Failed to process the sale.`
      );
    }
  }
});