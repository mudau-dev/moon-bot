const { findOrCreateWhatsApp } = require("../../database/users");
const { getTierLabel } = require("../../utils/cardGenerator");

moon({
  name: "cardgive",
  alias: ["cdgv"],
  category: "cards",
  description: "Give a card to another user",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const contextInfo = m.message?.extendedTextMessage?.contextInfo;
      const target = contextInfo?.mentionedJid?.[0]
        || contextInfo?.participant
        || contextInfo?.quotedParticipant
        || null;

      if (!target) return reply("❌ Mention or reply to a user.");
      if (target === sender) return reply("❌ You can't give cards to yourself.");

      const index = Number.parseInt(args[0], 10) - 1;
      if (!Number.isInteger(index) || index < 0) {
        return reply("❌ Usage: .cardgive <card number> (mention or reply user)");
      }

      const giver = await findOrCreateWhatsApp(sender);
      const receiver = await findOrCreateWhatsApp(target);
      if (!giver.cards?.length) return reply("❌ You don't have any cards.");
      if (index >= giver.cards.length) return reply("❌ Invalid card index.");
      if ((receiver.cards || []).length >= (receiver.cardLimit || 100)) {
        return reply("❌ That user reached card limit.");
      }

      const card = giver.cards[index];
      if (card.locked || card.inAuction) return reply("❌ This card cannot be given.");

      giver.cards.splice(index, 1);
      receiver.cards.push(card);
      giver.markModified("cards");
      receiver.markModified("cards");
      await giver.save();
      await receiver.save();

      return sock.sendMessage(jid, {
        text: `🎁 *CARD TRANSFERRED*\n\n🃏 ${card.name}\n⭐ ${getTierLabel(card.tier)}\n\nFrom: @${sender.split("@")[0]}\nTo: @${target.split("@")[0]}`,
        mentions: [sender, target],
      }, { quoted: m });
    } catch (err) {
      console.error("CGIVE ERROR:", err);
      return reply("❌ Failed to give card.");
    }
  },
});
