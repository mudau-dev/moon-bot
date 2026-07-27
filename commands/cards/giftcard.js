const { findOrCreateWhatsApp } = require("../../database/users");
const { getTierLabel } = require("../../utils/cardGenerator");

function getContext(message) {
  return message.message?.extendedTextMessage?.contextInfo
    || message.message?.imageMessage?.contextInfo
    || message.message?.videoMessage?.contextInfo
    || {};
}

function resolveTarget(message) {
  const context = getContext(message);
  return context?.mentionedJid?.[0] || context?.participant || context?.quotedParticipant || null;
}

moon({
  name: "giftcard",
  aliases: ["gcard"],
  category: "cards",
  description: "Gift one of your cards to another user",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const target = resolveTarget(m);
      if (!target) {
        return reply("❌ Mention or reply to the user you want to gift the card to.\nUsage: .giftcard <card number> @user");
      }
      if (target === sender) return reply("❌ You can't gift a card to yourself.");

      const index = Number.parseInt(args[0], 10) - 1;
      if (!Number.isInteger(index) || index < 0) {
        return reply("❌ Usage: .giftcard <card number> @user");
      }

      const senderUser = await findOrCreateWhatsApp(sender);
      const targetUser = await findOrCreateWhatsApp(target);
      senderUser.cards = Array.isArray(senderUser.cards) ? senderUser.cards : [];
      targetUser.cards = Array.isArray(targetUser.cards) ? targetUser.cards : [];

      if (!senderUser.cards.length) return reply("❌ You have no cards to gift.");
      if (index >= senderUser.cards.length) return reply("❌ Invalid card number.");
      if (targetUser.cards.length >= (targetUser.cardLimit || 100)) {
        return reply("❌ That user reached their card limit.");
      }

      const card = senderUser.cards[index];
      if (card.locked || card.inAuction) {
        return reply("❌ This card is locked or in auction and cannot be gifted.");
      }

      senderUser.cards.splice(index, 1);
      targetUser.cards.push(card);
      senderUser.totalCards = Math.max(0, Number(senderUser.totalCards || senderUser.cards.length + 1) - 1);
      targetUser.totalCards = Number(targetUser.totalCards || targetUser.cards.length - 1) + 1;
      senderUser.markModified("cards");
      targetUser.markModified("cards");
      await senderUser.save();
      await targetUser.save();

      return sock.sendMessage(jid, {
        text: `🎁 *CARD GIFTED*\n\n🃏 ${card.name || "Unknown Card"}\n⭐ ${getTierLabel(card.tier)}\n\n📤 From: @${sender.split("@")[0]}\n📥 To: @${target.split("@")[0]}`,
        mentions: [sender, target],
      }, { quoted: m });
    } catch (err) {
      console.error("GIFTCARD ERROR:", err);
      return reply("❌ Gift failed. Please try again.");
    }
  },
});
