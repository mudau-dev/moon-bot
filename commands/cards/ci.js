// commands/cards/ci.js
// ─────────────────────────────────────────────────────────────────────────────
// .ci — Card Info: search and display a card from the card API/database
// ─────────────────────────────────────────────────────────────────────────────

const User = require("../../models/User");
const {
  buildMediaPayload,
  findStoredCard,
  getTierLabel,
  normalizeTier,
  searchCards,
  searchApiCards,
} = require("../../utils/cardGenerator");

moon({
  name: "ci",
  aliases: ["cardinfo", "card-info"],
  category: "cards",
  description: "View detailed info about a card. Search by card ID, name, or name + tier.",
  usage: ".ci <card_id>  |  .ci <name>  |  .ci <name> <tier>",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!args.length) {
        return reply(
          `📋 *CARD INFO*\n\n` +
          `Usage:\n` +
          `• \`.ci <card_id>\` — Look up by exact card ID\n` +
          `• \`.ci <name>\` — Search by card name\n` +
          `• \`.ci <name> <tier>\` — Search by name and tier (1-5, S)\n\n` +
          `Example: \`.ci Rem 3\``
        );
      }

      const input = args.join(" ").trim();

      // ── 1. Try exact card ID lookup first ─────────────────────────────
      const isLikelyId =
        args.length === 1 && (input.length <= 20 || input.includes("-"));

      let card = null;

      if (isLikelyId) {
        card = await findStoredCard(input);
      }

      // ── 2. Try name + tier search ──────────────────────────────────────
      if (!card && args.length >= 2) {
        const lastArg = args[args.length - 1];
        const requestedTier = normalizeTier(lastArg, null);

        if (requestedTier) {
          const nameQuery = args.slice(0, -1).join(" ").trim();

          // Search stored cards first
          let matches = await searchCards(nameQuery, 25);

          // If not found locally, try the API
          if (!matches.length) {
            try {
              matches = await searchApiCards(nameQuery, 25);
            } catch (e) {
              console.warn("[CI] API search failed:", e.message);
            }
          }

          card =
            matches.find(
              (entry) => normalizeTier(entry.tier) === requestedTier
            ) || null;

          if (!card && matches.length) {
            // Return suggestions if tier not matched
            const suggestions = matches
              .slice(0, 5)
              .map(
                (entry, i) =>
                  `${i + 1}. ${entry.name} (${entry.cardId}) [${getTierLabel(entry.tier)}]`
              )
              .join("\n");
            return reply(
              `❌ No *${getTierLabel(requestedTier)}* card found for "*${nameQuery}*".\n\n` +
              `*Similar cards:*\n${suggestions}`
            );
          }
        }
      }

      // ── 3. Plain name search ───────────────────────────────────────────
      if (!card) {
        let matches = await searchCards(input, 10);

        // If not found locally, try the API
        if (!matches.length) {
          try {
            matches = await searchApiCards(input, 10);
          } catch (e) {
            console.warn("[CI] API search failed:", e.message);
          }
        }

        if (matches.length === 1) {
          card = matches[0];
        } else if (matches.length > 1) {
          // Multiple results — show list
          const list = matches
            .slice(0, 8)
            .map(
              (entry, i) =>
                `${i + 1}. *${entry.name}* (${entry.cardId}) [${getTierLabel(entry.tier)}]`
            )
            .join("\n");
          return reply(
            `🔍 *Multiple cards found for "*${input}*":*\n\n${list}\n\n` +
            `Use \`.ci <name> <tier>\` to be more specific.\n` +
            `Example: \`.ci ${matches[0].name} ${getTierLabel(matches[0].tier)}\``
          );
        }
      }

      // ── 4. Nothing found ───────────────────────────────────────────────
      if (!card) {
        return reply(
          `❌ *Card not found:* "${input}"\n\n` +
          `Try:\n` +
          `• \`.ci <name>\` — Search by name\n` +
          `• \`.ci <name> <tier>\` — Search by name and tier\n` +
          `• Check the card market on the website for the exact name.`
        );
      }

      // ── 5. Build card info text ────────────────────────────────────────
      const owners = await User.find({ "cards.cardId": card.cardId })
        .select("username pushName name whatsappNumber moonId")
        .limit(5)
        .lean();

      const ownerText =
        owners.length
          ? owners
              .map(
                (u, i) =>
                  `${i + 1}. ${
                    u.username || u.pushName || u.name || u.moonId || "Unknown"
                  }`
              )
              .join("\n")
          : "No owners yet";

      const tierLabel = getTierLabel(card.tier);
      const price = card.price
        ? Number(card.price).toLocaleString() + " coins"
        : "N/A";

      const caption =
        `🃏 *CARD INFO*\n` +
        `─────────────────────────\n` +
        `📛 *Name:* ${card.name}\n` +
        `🆔 *Card ID:* ${card.cardId}\n` +
        `⭐ *Tier:* ${tierLabel}\n` +
        `📺 *Series:* ${card.series || "Unknown"}\n` +
        `💰 *Price:* ${price}\n` +
        `✍️ *Creator:* ${card.creator || "Eclipse Card API"}\n` +
        `📝 *Description:* ${card.description || "No description."}\n` +
        `─────────────────────────\n` +
        `👥 *Owners (top 5):*\n${ownerText}`;

      // ── 6. Send with image/video if available ─────────────────────────
      const payload = buildMediaPayload(card, caption);
      if (payload) {
        return sock.sendMessage(jid, payload, { quoted: m });
      }

      // Fallback: text only
      return reply(caption);
    } catch (err) {
      console.error("[CI ERROR]", err);
      return reply("❌ Card lookup failed: " + err.message);
    }
  },
});
