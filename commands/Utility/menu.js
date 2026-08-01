/**
 * commands/Utility/menu.js
 * PREMIUM REDESIGN: Moonlight and Tensura Community Menu
 * Enhanced with cooler UI styling and animations
 */
const config = require('../../config');
const ReadMore = '\u200e'.repeat(4001);

moon({
  name: 'menu',
  category: 'Utility',
  aliases: ['help', 'h', 'commands'],
  description: 'View the Moonlight command scrolls',
  cooldown: 5,
  async execute(sock, jid, sender, args, m, { reply, commands }) {
    try {
      if (!commands) return reply('❌ Failed to summon the command scrolls.');

      // ── CATEGORY CONFIG ──────────────────────────────────────────────────
      const CATEGORY_CONFIG = {
        GENERAL:      { emoji: '💠', label: 'General', color: '🔵' },
        LEGACY:       { emoji: '⚔️', label: 'Moonlight Legacy', color: '🔴' },
        CARDS:        { emoji: '🎴', label: 'Card Collection', color: '🟣' },
        ECONOMY:      { emoji: '💰', label: 'Economy', color: '🟡' },
        GAMBLING:     { emoji: '🎰', label: 'Gamble', color: '🟠' },
        GAMES:        { emoji: '🎮', label: 'Games', color: '🟢' },
        GUILDS:       { emoji: '🏰', label: 'Guilds', color: '🟤' },
        REALMS:       { emoji: '🌌', label: 'Realms', color: '⚪' },
        SHOP:         { emoji: '🛍️', label: 'Shop', color: '🔴' },
        FUN:          { emoji: '🎭', label: 'Fun', color: '🟣' },
        INTERACTION:  { emoji: '👤', label: 'Interaction', color: '🔵' },
        DOWNLOADERS:  { emoji: '📲', label: 'Downloaders', color: '🟡' },
        SEARCH:       { emoji: '🔍', label: 'Search', color: '🟢' },
        AI:           { emoji: '🤖', label: 'Artificial Intel', color: '🟠' },
        POKÉMON:      { emoji: '🐉', label: 'Pokémon', color: '🟣' },
        UTILITY:      { emoji: '⚙️', label: 'Utility', color: '🔵' },
        EVENT:        { emoji: '🎉', label: 'Events', color: '🟡' },
        NSFW:         { emoji: '🔞', label: 'NSFW', color: '🔴' },
      };

      const ORDER = [
        'GENERAL', 'LEGACY', 'CARDS', 'ECONOMY', 'GAMBLING', 'GAMES',
        'GUILDS', 'REALMS', 'SHOP', 'FUN', 'INTERACTION', 'DOWNLOADERS',
        'SEARCH', 'AI', 'POKÉMON', 'UTILITY', 'EVENT', 'NSFW'
      ];

      // ── GROUP COMMANDS ──────────────────────────────────────────────────
      const grouped = {};
      for (const cmd of commands.values()) {
        if (!cmd?.name) continue;
        const cat = (cmd.category || 'GENERAL').toUpperCase().trim();
        if (cat === 'OWNER' || cat === 'ADMIN') continue;
        if (!grouped[cat]) grouped[cat] = new Map();
        if (!grouped[cat].has(cmd.name)) grouped[cat].set(cmd.name, cmd);
      }

      const username  = m.pushName || sender.split('@')[0];
      const prefix    = config.PREFIX;
      const botName   = config.BOT_NAME;
      const ownerName = config.OWNER_NAME;

     let  text += `┌─ *Moonlight haven* ─────\n`;
      text += `│ *My Name:* ${botName}\n`;
      text += `│ *My Creator:* ${ownerName}\n`;
      text += `│ *My Prefix:* \`${prefix}\`\n`;
      text += `│ *Tip:* Use \`.website\` for help\n`;
      text += `└───────────────\n\n`;
      
      text += `${ReadMore}`;

      // ── SORT CATEGORIES ─────────────────────────────────────────────────
      const sortedCats = Object.keys(grouped).sort((a, b) => {
        const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

      // ── BUILD COMMAND LIST ──────────────────────────────────────────────
      for (const cat of sortedCats) {
        const cfg = CATEGORY_CONFIG[cat] || { emoji: '✨', label: cat.charAt(0) + cat.slice(1).toLowerCase(), color: '⚪' };
        const cmds = [...grouped[cat].values()].sort((a, b) => a.name.localeCompare(b.name));
        
        text += `*${cfg.emoji} ${cfg.label.toUpperCase()}*\n`;
        text += `┌─────────────────────\n`;
        
        for (const cmd of cmds) {
          text += `│ ✦ \`${prefix}${cmd.name}\`\n`;
          
          // Subcommands check
          const subs = Array.isArray(cmd.subcommands) && cmd.subcommands.length ? cmd.subcommands : [];
          if (subs.length) {
            text += `│   ⤷ *${subs.join(' • ')}*\n`;
          }
        }
        text += `└─────────────────────\n\n`;
      }
      const menuImage = config.MENU_IMAGE;

      try {
        return await sock.sendMessage(jid, {
          image: { url: menuImage },
          caption: text,
          mentions: [sender]
        }, { quoted: m });
      } catch (_) {
        return reply(text);
      }
    } catch (err) {
      console.error('[MENU ERROR]', err);
      return reply('❌ Failed to summon the Moonlight menu.');
    }
  }
});

