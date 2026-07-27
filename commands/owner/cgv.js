const Card = require("../../models/Card");
const { findOrCreateWhatsApp } = require("../../database/users");

function getContext(m) {
  return m.message?.extendedTextMessage?.contextInfo ||
         m.message?.imageMessage?.contextInfo ||
         m.message?.videoMessage?.contextInfo ||
         {};
}

function normaliseNumber(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^0-9]/g, "");
  return cleaned ? `${cleaned}@s.whatsapp.net` : null;
}

function resolveTargetAndQuery(args, m) {
  const ctx = getContext(m);
  const mentioned = ctx?.mentionedJid?.[0];
  const replied = ctx?.participant || ctx?.quotedParticipant;

  if (mentioned) {
    const query = args.filter(a => !a.includes("@") && !/^\d{5,}$/.test(a.replace(/[^0-9]/g, ""))).join(" ").trim();
    return { target: mentioned, query };
  }

  if (replied) {
    return { target: replied, query: args.join(" ").trim() };
  }

  const first = args[0];
  const fromArg = normaliseNumber(first);
  if (fromArg) {
    return { target: fromArg, query: args.slice(1).join(" ").trim() };
  }

  return { target: null, query: "" };
}

function buildOwnedCard(card) {
  return {
    cardId: card.cardId,
    name: card.name,
    description: card.description || "",
    tier: card.tier,
    price: Number(card.price || 0),
    series: card.series || "Unknown",
    creator: card.creator || "Unknown",
    media: card.media || null,
    mediaType: card.mediaType || "image",
    obtainedAt: new Date(),
    level: 1,
    xp: 0,
    locked: false,
    inAuction: false
  };
}

moon({
  name: "cgv",
  category: "owner",
  roles: ["Owner", "Mod", "True Owner"],
  description: "Give a card directly from the card database",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const senderUser = await findOrCreateWhatsApp(sender);

      const isAllowed =
        senderUser?.isTrueOwner === true ||
        senderUser?.role === "True Owner" ||
        senderUser?.role === "Owner" ||
        senderUser?.role === "CDC";

      if (!isAllowed) {
        return reply("❌ You can't do that here.");
      }

      const { target, query } = resolveTargetAndQuery(args, m);

      if (!target) {
        return reply("❌ Mention, reply to a user, or provide a number.\nUsage: .cgv @user <CardName/CardId>");
      }

      if (!query) {
        return reply("❌ Usage: .cgv @user <CardName/CardId>");
      }

      const card = await Card.findOne({
        $or: [
          { cardId: query.toUpperCase() },
          { cardId: query },
          { name: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
        ]
      });

      if (!card) {
        return reply("❌ Card not found in database.");
      }

      const user = await findOrCreateWhatsApp(target);
      user.cards = Array.isArray(user.cards) ? user.cards : [];

      if (user.cards.length >= (user.cardLimit || 100)) {
        return reply("❌ That user reached their card limit.");
      }

      user.cards.push(buildOwnedCard(card));
      user.totalCards = Number(user.totalCards || user.cards.length - 1) + 1;
      user.uniqueCards = new Set(user.cards.map(c => c?.cardId).filter(Boolean)).size;
      user.markModified("cards");

      await user.save();

      return sock.sendMessage(jid, {
        text:
`✅ *CARD GRANTED*

👤 User: @${target.split("@")[0]}
🃏 Card: ${card.name}
🆔 ID: ${card.cardId}
⭐ Tier: ${card.tier}
📦 Total Cards: ${user.cards.length}`,
        mentions: [target]
      }, { quoted: m });

    } catch (err) {
      console.error("CGV ERROR:", err);
      return reply("❌ Failed to give card. Check the card name/ID and try again.");
    }
  }
});
