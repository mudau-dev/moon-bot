const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");
const {
  findStoredCard,
  getTierLabel,
  getTierNumber,
  searchStoredCards,
} = require("../../utils/cardGenerator");

moon({
  name: "crrt",
  category: "cards",
  description: "Check a card's tier power",

  async execute(sock, jid, sender, args, m) {
    const query = args.join(" ").trim();
    if (!query) return;

    let card = await findStoredCard(query);
    if (!card) {
      const matches = await searchStoredCards(query, 1);
      card = matches[0] || null;
    }
    if (!card) return;

    const power = getTierNumber(card.tier);
    const maxPower = Math.max(6, power);

    const message = generateWAMessageFromContent(
      jid,
      proto.Message.fromObject({
        pollResultSnapshotMessage: proto.Message.PollResultSnapshotMessage.fromObject({
          name: `🃏 CARD RARITY CHECK\n\n${card.name}\n${getTierLabel(card.tier)}\nID: ${card.cardId}`,
          pollVotes: [
            { optionName: "TIER POWER", optionVoteCount: power },
            { optionName: "MAX RECORDED POWER", optionVoteCount: maxPower },
            { optionName: getTierLabel(card.tier), optionVoteCount: power },
          ],
        }),
      }),
      { quoted: m }
    );

    return sock.relayMessage(jid, message.message, { messageId: message.key.id });
  },
});
