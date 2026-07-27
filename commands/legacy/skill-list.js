/**
 * commands/legacy/skill-list.js
 * .skill-list — Show all 50 obtainable skills in the game.
 */
const { SKILLS } = require('../../utils/skillLibrary');

moon({
  name: 'skill-list',
  aliases: ['allskills', 'sl'],
  category: 'legacy',
  description: 'View all 50 obtainable Moonlight Legacy skills',
  async execute(sock, jid, sender, args, m, { reply }) {
    const page = parseInt(args[0]) || 1;
    const perPage = 10;
    const totalPages = Math.ceil(SKILLS.length / perPage);

    if (page > totalPages || page < 1) {
      return reply(`❌ Invalid page. Use *.sl 1* to *.sl ${totalPages}*`);
    }

    const start = (page - 1) * perPage;
    const slice = SKILLS.slice(start, start + perPage);

    const list = slice.map((s, i) => {
      return `*${start + i + 1}. ${s.name}* (${s.type})\n` +
             `💧 Mana: ${s.mana}  |  💥 Power: ${s.dmg > 0 ? s.dmg : 'Heal ' + Math.abs(s.dmg)}\n` +
             `📜 ${s.desc}`;
    }).join('\n\n');

    return reply(
      `⚡ *MOONLIGHT SKILL LIBRARY* (Page ${page}/${totalPages})\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${list}\n\n` +
      `> Use \`.sl <page>\` to see more.\n` +
      `> Unlock skills by leveling up and progressing stages!`
    );
  },
});
