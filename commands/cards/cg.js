const { findOrCreateWhatsApp } = require("../../database/users");
const { mentionTag } = require("../../handlers/_shared");
const { getTierLabel } = require("../../utils/cardGenerator");

moon({
  name: "cg",
  category: "cards",
  description: "Gift a card by index to a user",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || m.message?.extendedTextMessage?.contextInfo?.participant;
      if (!target) {
        return reply("❌ Mention or reply to a user to gift them a card.\nUsage: `.cg <index>`");
      }
      if (target === sender) return reply("❌ You can't gift a card to yourself.");

      const index = Number.parseInt(args[0], 10) - 1;
      if (!Number.isInteger(index) || index < 0) {
        return reply("❌ Usage: `.cg <index>` (e.g., `.cg 1`) while replying/tagging a user.");
      }

      const senderUser = await findOrCreateWhatsApp(sender);
      const targetUser = await findOrCreateWhatsApp(target);
      if (!senderUser.cards?.length) return reply("❌ You don't have any cards to gift.");
      if (index >= senderUser.cards.length) {
        return reply(`❌ Invalid index. You only have ${senderUser.cards.length} cards.`);
      }

      const card = senderUser.cards[index];
      if (card.locked || card.inAuction) {
        return reply("❌ This card is locked or in auction and cannot be gifted.");
      }
      if ((targetUser.cards || []).length >= (targetUser.cardLimit || 100)) {
        return reply("❌ That user has reached their card limit.");
      }

      senderUser.cards.splice(index, 1);
      targetUser.cards.push(card);
      senderUser.markModified("cards");
      targetUser.markModified("cards");
      await senderUser.save();
      await targetUser.save();

      return sock.sendMessage(jid, {
        text: `🎁 *CARD GIFTED* 🎁\n\n🃏 Card: *${card.name}*\n⭐ Tier: *${getTierLabel(card.tier)}*\n\n📤 From: ${mentionTag(sender)}\n📥 To: ${mentionTag(target)}`,
        mentions: [sender, target],
      }, { quoted: m });
    } catch (err) {
      console.error("CG CMD ERROR:", err);
      return reply("❌ Error gifting card.");
    }
  },
});
