// commands/Yugioh/yclaim.js
// ─────────────────────────────────────────────────────────────────────────────
// .yclaim <card_id>
// Claim the active Yu-Gi-Oh card in the current group.
// ─────────────────────────────────────────────────────────────────────────────

const { findOrCreateWhatsApp } = require('../../database/users');
const YugiohSpawn = require('../../models/yugioh/YugiohSpawn');
const YugiohCard = require('../../models/yugioh/YugiohCard');
const { rarityEmoji } = require('../../utils/yugiohApi');

moon({
  name: 'yclaim',
  category: 'Yu-gi-oh',
  description: 'Claim a card that has dropped in the current group',
  usage: '.yclaim <card_id>',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith('@g.us')) {
        return reply('❌ This command can only be used in groups.');
      }

      const inputId = parseInt(args[0], 10);

      if (!inputId) {
        return reply(
          `❌ Invalid card ID.\n\n` +
          `Usage: *.yclaim <card_id>*`
        );
      }

      const spawn = await YugiohSpawn.findOne({ groupJid: jid });

      if (!spawn) {
        return reply(
          `❌ There isn't an active Yu-Gi-Oh card in this group.`
        );
      }

      if (spawn.cardId !== inputId) {
        return reply(
          `❌ Incorrect card ID.\n\n` +
          `🆔 Active Card ID: *${spawn.cardId}*`
        );
      }

      const owned = await YugiohCard.countDocuments({
        ownerJid: sender
      });

      if (owned >= 100) {
        return reply(
          `❌ Your collection is full. (100/100)\n` +
          `Delete a card with *.ydel <index>* first.`
        );
      }

      await YugiohCard.create({
        ownerJid: sender,
        cardId: spawn.cardId,
        name: spawn.name,
        type: spawn.type,
        frameType: spawn.frameType,
        desc: spawn.desc,
        race: spawn.race,
        attribute: spawn.attribute,
        atk: spawn.atk,
        def: spawn.def,
        level: spawn.level,
        imageUrl: spawn.imageUrl,
        rarity: spawn.rarity,
        location: 'collection',
        spawnedIn: jid,
      });

      await YugiohSpawn.deleteOne({
        groupJid: jid
      });

      const emoji = rarityEmoji(spawn.rarity);

      return reply(
        `✅ Card claimed!\n\n` +
        `🃏 ${spawn.name}\n` +
        `${emoji} ${spawn.rarity}\n\n` +
        `📦 Added to your collection.`,
        { mentions: [sender] }
      );

    } catch (err) {
      console.error('[YCLAIM ERROR]', err);

      return reply(
        `❌ Failed to claim the card.`
      );
    }
  }
});