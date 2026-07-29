/**
 * commands/legacy/start.js
 * .genesis — Create a permanent Moonlight Legacy account.
 */
const LegacyPlayer = require('../../models/LegacyPlayer');

const CLASS_STARTING_STATS = {
  Mage:    { hp: 80,  maxHp: 80,  mana: 150, maxMana: 150, attack: 8,  defense: 4,  magic: 20, critRate: 5,  speed: 8  },
  Warrior: { hp: 150, maxHp: 150, mana: 80,  maxMana: 80,  attack: 20, defense: 12, magic: 5,  critRate: 5,  speed: 8  },
  Assassin:{ hp: 100, maxHp: 100, mana: 100, maxMana: 100, attack: 15, defense: 5,  magic: 8,  critRate: 20, speed: 20 },
  Archer:  { hp: 100, maxHp: 100, mana: 110, maxMana: 110, attack: 14, defense: 6,  magic: 8,  critRate: 12, speed: 15 },
  Paladin: { hp: 130, maxHp: 130, mana: 100, maxMana: 100, attack: 12, defense: 18, magic: 10, critRate: 5,  speed: 7  },
};

moon({
  name: 'genesis',
  aliases: ['legacy-start'],
  category: 'legacy',
  description: 'Create your permanent Moonlight Legacy account',
  async execute(sock, jid, sender, args, m, { reply, pushName }) {
    try {
      const { findOrCreateWhatsApp } = require("../../database/users");
      const user = await findOrCreateWhatsApp(sender);
      const userId = user.moonId || sender;
      
      const existing = await LegacyPlayer.findOne({ $or: [{ whatsappId: sender }, { whatsappId: userId }] });
      if (existing) {
        return reply(
          `⚠️ *You already have a Legacy account!*\n\n` +
          `📛 Name: ${existing.name}\n` +
          `⚔️ Class: ${existing.class || 'Not chosen yet'}\n` +
          `🏅 Rank: ${existing.rank}\n` +
          `📊 Level: ${existing.level}\n\n` +
          `Use *.me* to view your full profile card.\n` +
          `> Accounts are permanent and cannot be recreated.`
        );
      }

      const player = await LegacyPlayer.create({
        whatsappId: userId,
        name: pushName || user.username || 'Unknown',
        gender: null,
        age: null,
        class: null,
        rank: 'Commoner',
        rankIndex: 0,
        level: 1,
        xp: 0,
        xpToNext: 100,
        ...CLASS_STARTING_STATS['Warrior'], // default base stats
        gold: 500,
        wins: 0,
        losses: 0,
        skills: [],
        stage: 1,
        stageProgress: 0,
        isActive: false,
      });

      return reply(
        `╔═════════════════════╗\n` +
        `║⚔️ LEGACY ACCOUNT CREATED║\n` +
        `╚═════════════════════╝\n\n` +
        `Welcome to *Moonlight Legacy*, ${player.name}!\n\n` +
        `Your permanent account has been created.\n\n` +
        `*📋 Next Steps:*\n` +
        `1️⃣  Set your gender:\n   \`.fill gender male\` or \`.fill gender female\`\n\n` +
        `2️⃣  Set your age:\n   \`.fill age 1\`\n\n` +
        `3️⃣  Choose your class:\n   \`.choose\` — Pick one of 5 permanent classes\n\n` +
        `4️⃣  View your profile:\n   \`.me\`\n\n` +
        `> Your progress is saved permanently in the database.\n` +
        `> Use \`.helplegacy\` for all available commands.`
      );
    } catch (err) {
      console.error('[GENESIS CMD ERROR]', err);
      return reply('❌ Error creating your Legacy account. Please try again.');
    }
  },
});
