// commands/Yugioh/yspawn.js
// ─────────────────────────────────────────────────────────────────────────────
// .yspawn
// Spend 1,000 coins to spawn a random Yu-Gi-Oh card.
// ─────────────────────────────────────────────────────────────────────────────

const { findOrCreateWhatsApp } = require('../../database/users');
const YugiohSpawn = require('../../models/yugioh/YugiohSpawn');
const { fetchRandomCard, rarityEmoji } = require('../../utils/yugiohApi');

const SPAWN_COST = 1000;

moon({
  name: 'yspawn',
  category: 'Yu-gi-oh',
  description: 'Spawn a random Yu-Gi-Oh card',
  usage: '.yspawn',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith('@g.us')) {
        return reply('❌ This command can only be used in groups.');
      }

      // Check for existing spawn
      const existing = await YugiohSpawn.findOne({ groupJid: jid });

      if (existing) {
        return reply(
          `⚠️ A card is already active in this group.\n\n` +
          `🃏 ${existing.name}\n` +
          `🆔 ${existing.cardId}\n\n` +
          `Claim it with *.yclaim ${existing.cardId}*`
        );
      }

      // Check balance
      const user = await findOrCreateWhatsApp(sender);

      if ((user.balance || 0) < SPAWN_COST) {
        return reply(
          `❌ You don't have enough coins.\n\n` +
          `💰 Cost: ${SPAWN_COST.toLocaleString()} coins\n` +
          `💳 Balance: ${(user.balance || 0).toLocaleString()} coins`
        );
      }

      user.balance -= SPAWN_COST;
      await user.save();

      // Fetch random card
      let card;

      try {
        card = await fetchRandomCard();
      } catch (apiErr) {
        user.balance += SPAWN_COST;
        await user.save();

        console.error('[YSPAWN API ERROR]', apiErr);

        return reply(
          `❌ Failed to fetch a card.\n` +
          `Your coins have been refunded.`
        );
      }

      // Save spawn
      await YugiohSpawn.create({
        groupJid: jid,
        cardId: card.cardId,
        name: card.name,
        type: card.type,
        frameType: card.frameType,
        desc: card.desc,
        race: card.race,
        attribute: card.attribute,
        atk: card.atk,
        def: card.def,
        level: card.level,
        imageUrl: card.imageUrl,
        rarity: card.rarity,
        spawnedIn: jid,
      });

      const emoji = rarityEmoji(card.rarity);

      let caption =
`🃏 *A Yu-Gi-Oh Card Appeared!*

🃏 ${card.name}
📋 ${card.type}
${emoji} ${card.rarity}

`;

      if (card.level != null) {
        caption += `⭐ Level: ${card.level}\n`;
      }

      if (card.attribute) {
        caption += `🌀 Attribute: ${card.attribute}\n`;
      }

      if (card.race) {
        caption += `🏷️ Race: ${card.race}\n`;
      }

      if (card.atk != null) {
        caption += `⚔️ ATK: ${card.atk}\n`;
      }

      if (card.def != null) {
        caption += `🛡️ DEF: ${card.def}\n`;
      }

      caption +=
`\n🆔 Card ID: ${card.cardId}

💡 Claim it with:
*.yclaim ${card.cardId}*`;

      if (card.imageUrl) {
        return sock.sendMessage(
          jid,
          {
            image: { url: card.imageUrl },
            caption
          },
          { quoted: m }
        );
      }

      return reply(caption);

    } catch (err) {
      console.error('[YSPAWN ERROR]', err);

      return reply(
        `❌ Failed to spawn a card.`
      );
    }
  }
});