// commands/Yugioh/ytrade.js
// ─────────────────────────────────────────────────────────────────────────────
// .ytrade <your index> <their index>  — Trade cards
// .ytrade <your index>                — Gift a card
// .ytrade yes                         — Accept
// .ytrade no                          — Decline
// ─────────────────────────────────────────────────────────────────────────────

const YugiohCard = require('../../models/yugioh/YugiohCard');
const YugiohTrade = require('../../models/yugioh/YugiohTrade');
const { rarityEmoji } = require('../../utils/yugiohApi');

moon({
  name: 'ytrade',
  category: 'Yu-gi-oh',
  description: 'Trade or gift a Yu-Gi-Oh card',
  usage: '.ytrade <your index> [their index]',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith('@g.us')) {
        return reply('❌ This command can only be used in groups.');
      }

      const sub = (args[0] || '').toLowerCase();

      // Accept
      if (sub === 'yes') {
        const offer = await YugiohTrade.findOne({
          toJid: sender,
          type: 'trade',
          status: 'pending'
        }).sort({ createdAt: -1 });

        if (!offer) {
          return reply('❌ You have no pending trade offers.');
        }

        const fromCard = await YugiohCard.findById(offer.fromCardId);

        if (!fromCard || fromCard.ownerJid !== offer.fromJid) {
          await YugiohTrade.findByIdAndUpdate(offer._id, {
            status: 'expired'
          });

          return reply('❌ This offer is no longer available.');
        }

        // Gift
        if (!offer.toCardId) {
          await YugiohCard.findByIdAndUpdate(offer.fromCardId, {
            ownerJid: sender,
            location: 'collection',
            deckSlot: null
          });

          await YugiohTrade.findByIdAndUpdate(offer._id, {
            status: 'accepted'
          });

          return reply(
            `🎁 Gift received!\n\n` +
            `🃏 ${offer.fromCardName}`,
            { mentions: [sender] }
          );
        }

        // Trade
        const toCard = await YugiohCard.findById(offer.toCardId);

        if (!toCard || toCard.ownerJid !== sender) {
          await YugiohTrade.findByIdAndUpdate(offer._id, {
            status: 'expired'
          });

          return reply(
            `❌ Your selected card is no longer available.`
          );
        }

        await Promise.all([
          YugiohCard.findByIdAndUpdate(offer.fromCardId, {
            ownerJid: sender,
            location: 'collection',
            deckSlot: null
          }),
          YugiohCard.findByIdAndUpdate(offer.toCardId, {
            ownerJid: offer.fromJid,
            location: 'collection',
            deckSlot: null
          })
        ]);

        await YugiohTrade.findByIdAndUpdate(offer._id, {
          status: 'accepted'
        });

        return reply(
          `✅ Trade completed!\n\n` +
          `🃏 You received: ${offer.fromCardName}\n` +
          `🃏 They received: ${offer.toCardName}`,
          { mentions: [offer.fromJid, sender] }
        );
      }

      // Decline
      if (sub === 'no') {
        const offer = await YugiohTrade.findOne({
          toJid: sender,
          type: 'trade',
          status: 'pending'
        }).sort({ createdAt: -1 });

        if (!offer) {
          return reply('❌ You have no pending trade offers.');
        }

        await YugiohTrade.findByIdAndUpdate(offer._id, {
          status: 'declined'
        });

        return reply(
          `✅ Trade declined.`
        );
      }

      // Create trade
      const myIdx = parseInt(args[0], 10);
      const theirIdx = parseInt(args[1], 10) || null;

      if (!myIdx || myIdx < 1) {
        return reply(
          `❌ Invalid usage.\n\n` +
          `Trade: *.ytrade <your index> <their index>*\n` +
          `Gift: *.ytrade <your index>*`
        );
      }

      const ctx = m.message?.extendedTextMessage?.contextInfo || {};
      const mentions = ctx.mentionedJid || [];
      const quoted = ctx.participant || ctx.remoteJid;
      const targetJid = mentions[0] || (quoted !== sender ? quoted : null);

      if (!targetJid) {
        return reply(
          `❌ Tag or reply to the player you want to trade with.`
        );
      }

      if (targetJid === sender) {
        return reply(
          `❌ You can't trade with yourself.`
        );
      }

      const myCards = await YugiohCard.find({
        ownerJid: sender,
        location: 'collection'
      })
      .sort({ obtainedAt: -1 })
      .lean();

      const myCard = myCards[myIdx - 1];

      if (!myCard) {
        return reply(
          `❌ Card not found.`
        );
      }

      let theirCard = null;

      if (theirIdx) {
        const theirCards = await YugiohCard.find({
          ownerJid: targetJid,
          location: 'collection'
        })
        .sort({ obtainedAt: -1 })
        .lean();

        theirCard = theirCards[theirIdx - 1];

        if (!theirCard) {
          return reply(
            `❌ That player doesn't have a card at that index.`
          );
        }
      }

      await YugiohTrade.deleteMany({
        fromJid: sender,
        type: 'trade',
        status: 'pending'
      });

      await YugiohTrade.create({
        type: 'trade',
        fromJid: sender,
        fromCardId: myCard._id,
        fromCardName: myCard.name,
        toJid: targetJid,
        toCardId: theirCard?._id || null,
        toCardName: theirCard?.name || null,
        groupJid: jid
      });

      const myEmoji = rarityEmoji(myCard.rarity);
      const theirEmoji = theirCard ? rarityEmoji(theirCard.rarity) : '';

      const text = !theirCard
        ? `🎁 *Gift Offer*\n\n` +
          `From: @${sender.split('@')[0]}\n\n` +
          `${myEmoji} ${myCard.name}\n\n` +
          `@${targetJid.split('@')[0]}\n` +
          `Reply with:\n` +
          `• *.ytrade yes*\n` +
          `• *.ytrade no*`
        : `🤝 *Trade Offer*\n\n` +
          `From: @${sender.split('@')[0]}\n\n` +
          `Offering:\n${myEmoji} ${myCard.name}\n\n` +
          `For:\n${theirEmoji} ${theirCard.name}\n\n` +
          `@${targetJid.split('@')[0]}\n` +
          `Reply with:\n` +
          `• *.ytrade yes*\n` +
          `• *.ytrade no*`;

      return sock.sendMessage(
        jid,
        {
          text,
          mentions: [sender, targetJid]
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('[YTRADE ERROR]', err);

      return reply(
        `❌ Failed to process the trade.`
      );
    }
  }
});