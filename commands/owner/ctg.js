const CategoryLock = require('../../models/athers/CategoryLock');
const BYPASS_ROLES = ['True Owner', 'Owner', 'Mod', 'CDC'];

moon({
  name: 'ctg',
  aliases: ['category'],
  category: 'owner',
  roles: ['Mod', 'Owner', 'True Owner'],
  description: 'Lock or unlock command categories network-wide',
  usage: '.ctg list | .ctg lock/open all/ctg <index> | .ctg menu',
  async execute(sock, jid, sender, args, m, { reply, commands }) {
    try {
      const sub = (args[0] || '').toLowerCase();
      const action = (args[1] || '').toLowerCase();
      
      const catSet = new Set();
      for (const [, cmd] of commands) {
        if (cmd.category) catSet.add(cmd.category.toLowerCase());
      }
      const categories = Array.from(catSet).sort();

      if (!sub || sub === 'menu') {
        const text = `📂 *CATEGORY CONTROL MENU* 📂\n\n` +
          `• *.ctg list* - List all categories\n` +
          `• *.ctg g lock/open all* - Lock/Open all categories for this group\n` +
          `• *.ctg g lock/open <index>* - Lock/Open specific category for this group\n` +
          `• *.ctg lock <index> <reason>* - Global lock\n` +
          `• *.ctg open <index>* - Global unlock`;
        return reply(text);
      }

      if (sub === 'list') {
        const locks = await CategoryLock.find({}).lean();
        const lockMap = new Map(locks.map(l => [l.category, l]));
        let rows = '';
        categories.forEach((cat, i) => {
          const lock = lockMap.get(cat);
          const isLocked = lock?.locked === true;
          rows += `[${i + 1}] ${isLocked ? '🔒' : '🔓'} *${cat}*\n`;
        });
        return reply(`📂 *COMMAND CATEGORIES*\n\n${rows}`);
      }

      if (sub === 'g') {
        const target = args[2];
        if (action === 'lock' || action === 'open') {
          if (target === 'all') {
            for (const cat of categories) {
              if (cat === 'owner') continue;
              await CategoryLock.findOneAndUpdate(
                { category: cat },
                { locked: action === 'lock', lockedBy: sender },
                { upsert: true }
              );
            }
            return reply(`✅ ${action === 'lock' ? 'Locked' : 'Opened'} all categories.`);
          } else {
            const idx = parseInt(target);
            if (isNaN(idx) || idx < 1 || idx > categories.length) return reply("❌ Invalid index.");
            const targetCat = categories[idx - 1];
            if (targetCat === 'owner') return reply("❌ Cannot lock owner category.");
            
            await CategoryLock.findOneAndUpdate(
              { category: targetCat },
              { locked: action === 'lock', lockedBy: sender },
              { upsert: true }
            );
            return reply(`✅ ${action === 'lock' ? 'Locked' : 'Opened'} category *${targetCat}*.`);
          }
        }
      }

      // Legacy support for .ctg lock <index>
      if (sub === 'lock' || sub === 'open') {
        const idxArg = parseInt(args[1], 10);
        if (!idxArg || idxArg < 1 || idxArg > categories.length) return reply("❌ Invalid index.");
        const targetCat = categories[idxArg - 1];
        if (targetCat === 'owner') return reply("❌ Cannot lock owner category.");

        await CategoryLock.findOneAndUpdate(
          { category: targetCat },
          { locked: sub === 'lock', lockedBy: sender },
          { upsert: true }
        );
        return reply(`✅ Global ${sub === 'lock' ? 'Lock' : 'Open'} for *${targetCat}*.`);
      }

      return reply("❌ Unknown subcommand. Use *.ctg menu* for help.");
    } catch (err) {
      console.error('[CTG ERROR]', err);
      return reply('❌ Category command failed.');
    }
  }
});

module.exports = { BYPASS_ROLES };
