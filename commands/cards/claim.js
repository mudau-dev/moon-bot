const Card = require("../../models/Card");
const { findOrCreateWhatsApp } = require("../../database/users");
const { makeInventoryCard } = require("../../utils/cardGenerator");

const activeSpawns = global.activeSpawns || (global.activeSpawns = {});

moon({
  name: "claim",
  category: "cards",
  description: "Claim spawned card",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const cardIdInput = (args[0] || "").toUpperCase();
      if (!cardIdInput) return reply("❌ Usage: .claim <card_id>");

      const spawn = activeSpawns[jid];
      if (!spawn) return reply("❌ No active card in this chat.");
      if (spawn.cardId.toUpperCase() !== cardIdInput) return reply("❌ Wrong Card ID!");

      const card = await Card.findOne({ cardId: spawn.cardId });
      if (!card) {
        delete activeSpawns[jid];
        return reply("❌ Card not found.");
      }

      const user = await findOrCreateWhatsApp(sender);
      const price = Number(card.price || 0);
      const balance = Number(user.balance || 0);
      if (balance < price) {
        return reply(`❌ You need $${price.toLocaleString()} to claim this card.`);
      }

      user.balance = balance - price;
      user.cards = user.cards || [];
      user.cards.push(makeInventoryCard(card));
      user.markModified("cards");
      await user.save();

      delete activeSpawns[jid];
      await Card.updateOne({ cardId: card.cardId }, { $inc: { timesClaimed: 1 } });

      return reply(
`🎴 *CARD CLAIMED*
> @${sender.split("@")[0]} claimed *${card.name}* for *$${price.toLocaleString()}*.
Well done, card added to your collection.`,
        { mentions: [sender] }
      );
    } catch (err) {
      console.error("CLAIM ERROR:", err);
      return reply("❌ Claim failed.");
    }
  },
});
