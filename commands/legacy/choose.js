/**
 * commands/legacy/choose.js
 * .choose <class> — Permanently choose your Legacy class.
 */
const LegacyPlayer = require('../../models/LegacyPlayer');

const CLASSES = {
  mage: {
    name: 'Mage', icon: '🔮',
    desc: 'High Mana · Low HP · High Magic Damage',
    stats: { hp: 80, maxHp: 80, mana: 150, maxMana: 150, attack: 8, defense: 4, magic: 20, critRate: 5, speed: 8 },
    skills: ['Fireball', 'Ice Spike', 'Heal', 'Thunderbolt', 'Arcane Blast'],
  },
  warrior: {
    name: 'Warrior', icon: '⚔️',
    desc: 'Highest HP · Highest Physical Damage',
    stats: { hp: 150, maxHp: 150, mana: 80, maxMana: 80, attack: 20, defense: 12, magic: 5, critRate: 5, speed: 8 },
    skills: ['Slash', 'Heavy Strike', 'Berserk Rage', 'Cleave', 'Shield Bash'],
  },
  assassin: {
    name: 'Assassin', icon: '🗡️',
    desc: 'Highest Critical Rate · Highest Speed',
    stats: { hp: 100, maxHp: 100, mana: 100, maxMana: 100, attack: 15, defense: 5, magic: 8, critRate: 20, speed: 20 },
    skills: ['Shadow Strike', 'Poison Blade', 'Backstab', 'Smoke Bomb', 'Viper Bite'],
  },
  archer: {
    name: 'Archer', icon: '🏹',
    desc: 'Highest Accuracy · Long Range',
    stats: { hp: 100, maxHp: 100, mana: 110, maxMana: 110, attack: 14, defense: 6, magic: 8, critRate: 12, speed: 15 },
    skills: ['Arrow Shot', 'Triple Shot', 'Eagle Eye', 'Explosive Arrow', 'Steady Aim'],
  },
  paladin: {
    name: 'Paladin', icon: '🛡️',
    desc: 'Highest Defense · Support Skills',
    stats: { hp: 130, maxHp: 130, mana: 100, maxMana: 100, attack: 12, defense: 18, magic: 10, critRate: 5, speed: 7 },
    skills: ['Holy Strike', 'Divine Shield', 'Blessing', 'Heal', 'Judgment'],
  },
};

moon({
  name: 'choose',
  category: 'legacy',
  description: 'Permanently choose your Legacy class',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const player = await LegacyPlayer.findOne({ whatsappId: sender });
      if (!player) {
        return reply('❌ You don\'t have a Legacy account yet.\nUse *.genesis* to create one.');
      }
      if (!player.isActive) {
        return reply('⚠️ Complete your profile first.\nUse *.fill gender* and *.fill age* before choosing a class.');
      }
      if (player.class) {
        return reply(
          `⚠️ You already chose *${player.class}* as your class.\n\n` +
          `Classes are permanent. Only an administrator can reset your profile.`
        );
      }

      const input = (args[0] || '').toLowerCase();

      if (!input) {
        const list = Object.values(CLASSES).map(c =>
          `${c.icon} *${c.name}*\n   ${c.desc}\n   Starting Skills: ${c.skills.join(', ')}`
        ).join('\n\n');
        return reply(
          `⚔️ *Choose Your Class*\n\n` +
          `Classes are *permanent*. Choose wisely.\n\n` +
          `${list}\n\n` +
          `Usage: *.choose mage* / *.choose warrior* / etc.`
        );
      }

      const cls = CLASSES[input];
      if (!cls) {
        return reply(`❌ Unknown class: *${input}*\nChoose from: mage, warrior, assassin, archer, paladin`);
      }

      // Apply class stats and starting skills
      Object.assign(player, cls.stats);
      player.class = cls.name;
      player.skills = [...cls.skills];
      await player.save();

      return reply(
        `╔═════════════════════╗\n` +
        `║ ${cls.icon} CLASS SELECTED!  ${cls.icon}   ║\n` +
        `╚═════════════════════╝\n\n` +
        `You have chosen: *${cls.name}*\n` +
        `${cls.desc}\n\n` +
        `*Starting Skills (5):*\n` +
        cls.skills.map(s => `• ${s}`).join('\n') + '\n\n' +
        `*Base Stats:*\n` +
        `❤️ *HP:* \`${cls.stats.maxHp}\`  |  💧 *Mana:* \`${cls.stats.maxMana}\`\n` +
        `⚔️ *ATK:* \`${cls.stats.attack}\`  |  🛡️ *DEF:* \`${cls.stats.defense}\`\n` +
        `⚡ *SPD:* \`${cls.stats.speed}\`  |  🎯 *CRIT:* \`${cls.stats.critRate}%\`\n\n` +
        `> This choice is *permanent*.\n` +
        `> Use \`.me\` to view your profile card.`
      );
    } catch (err) {
      console.error('[CHOOSE CMD ERROR]', err);
      return reply('❌ Error selecting class. Please try again.');
    }
  },
});
