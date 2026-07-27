const { findOrCreateWhatsApp } = require("../../database/users");
const { mentionTag, formatNumber } = require("../../handlers/_shared");
const { getTierLabel } = require("../../utils/cardGenerator");

const tradeRequests = new Map();

moon({
  name: "cr",
  category: "cards",
  description: "Request to sell a card to a user",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const sub = (args[0] || "").toLowerCase();

      if (sub === "accept") {
        const requestKey = jid + sender;
        const request = tradeRequests.get(requestKey);
        if (!request) return reply("❌ You don't have any pending card purchase requests.");

        const seller = await findOrCreateWhatsApp(request.seller);
        const buyer = await findOrCreateWhatsApp(request.buyer);
        if (buyer.balance < request.price) {
          tradeRequests.delete(requestKey);
          return reply("❌ You don't have enough balance to buy this card.");
        }

        const cardIndex = seller.cards.findIndex((card) => card.instanceId === request.cardId);
        if (cardIndex < 0) {
          tradeRequests.delete(requestKey);
          return reply("❌ The seller no longer has this card.");
        }

        const [card] = seller.cards.splice(cardIndex, 1);
        buyer.balance -= request.price;
        seller.balance += request.price;
        buyer.cards.push(card);
        seller.markModified("cards");
        buyer.markModified("cards");
        await seller.save();
        await buyer.save();
        tradeRequests.delete(requestKey);

        return sock.sendMessage(jid, {
          text: `🤝 *CARD TRADE COMPLETE* 🤝\n\n🃏 Card: *${card.name}*\n💰 Price: *$${formatNumber(request.price)}*\n\n📤 Seller: ${mentionTag(request.seller)}\n📥 Buyer: ${mentionTag(request.buyer)}`,
          mentions: [request.seller, request.buyer],
        }, { quoted: m });
      }

      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || m.message?.extendedTextMessage?.contextInfo?.participant;
      if (!target) {
        return reply("❌ Mention or reply to a user to sell them a card.\nUsage: `.cr <price> <index>`");
      }
      if (target === sender) return reply("❌ You can't sell a card to yourself.");

      const price = Number.parseInt(args[0], 10);
      const index = Number.parseInt(args[1], 10) - 1;
      if (!Number.isInteger(price) || price < 0 || !Number.isInteger(index) || index < 0) {
        return reply("❌ Usage: `.cr <price> <index>` while replying/tagging a user.");
      }

      const sellerUser = await findOrCreateWhatsApp(sender);
      if (!sellerUser.cards?.length || index >= sellerUser.cards.length) {
        return reply("❌ Invalid card index.");
      }

      const card = sellerUser.cards[index];
      if (card.locked || card.inAuction) return reply("❌ This card is locked or in auction.");

      tradeRequests.set(jid + target, {
        seller: sender,
        buyer: target,
        cardId: card.instanceId,
        price,
        time: Date.now(),
      });
      setTimeout(() => tradeRequests.delete(jid + target), 60000);

      return sock.sendMessage(jid, {
        text: `💰 ${mentionTag(target)}, ${mentionTag(sender)} wants to sell you their card:\n\n🃏 Card: *${card.name}*\n⭐ Tier: *${getTierLabel(card.tier)}*\n💵 Price: *$${formatNumber(price)}*\n\n> Type *.cr accept* to buy this card.\n> _Expires in 60 seconds._`,
        mentions: [sender, target],
      }, { quoted: m });
    } catch (err) {
      console.error("CR CMD ERROR:", err);
      return reply("❌ Error processing card sale request.");
    }
  },
});
