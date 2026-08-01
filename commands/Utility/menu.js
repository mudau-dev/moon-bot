/**
 * commands/Utility/menu.js
 * PREMIUM REDESIGN: Moonlight Community Menu
 * 
 * Features:
 * - Dynamic category loading
 * - Fancy box styling with Tensura branding
 * - Sub-command listing (doesn't cut them off)
 * - Dynamic user/bot stats
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
        GENERAL:      { emoji: '💠', label: 'General' },
        LEGACY:       { emoji: '⚔️', label: 'Moonlight Legacy' },
        CARDS:        { emoji: '🎴', label: 'Card Collection' },
        ECONOMY:      { emoji: '💰', label: 'Economy' },
        GAMBLING:     { emoji: '🎰', label: 'Gamble' },
        GAMES:        { emoji: '🎮', label: 'Games' },
        GUILDS:       { emoji: '🏰', label: 'Guilds' },
        REALMS:       { emoji: '🌌', label: 'Realms' },
        SHOP:         { emoji: '🛍️', label: 'Shop' },
        FUN:          { emoji: '🎭', label: 'Fun' },
        INTERACTION:  { emoji: '👤', label: 'Interaction' },
        DOWNLOADERS:  { emoji: '📲', label: 'Downloaders' },
        SEARCH:       { emoji: '🔍', label: 'Search' },
        AI:           { emoji: '🤖', label: 'Artificial Intel' },
        POKÉMON:      { emoji: '🐉', label: 'Pokémon' },
        UTILITY:      { emoji: '⚙️', label: 'Utility' },
        EVENT:        { emoji: '🎉', label: 'Events' },
        NSFW:         { emoji: '🔞', label: 'NSFW' },
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

      // ── BUILD HEADER ────────────────────────────────────────────────────
      let text = `╭──❀ 𝕄𝕆𝕆ℕ𝕃𝕀𝔾ℍ𝕋 ❀──❀\n`;
      text += `│ *My Name:* ${botName}\n`;
      text += `│ *My Creator:* ${ownerName}\n`;
      text += `│ *My Prefix:* ${prefix}\n`;
      text += `╰───────────────❀\n`;
        text += `> Read welcome to the moonlight haven menu..read and understand young one 📜\n`;
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
        const cfg = CATEGORY_CONFIG[cat] || { emoji: '✨', label: cat.charAt(0) + cat.slice(1).toLowerCase() };
        const cmds = [...grouped[cat].values()].sort((a, b) => a.name.localeCompare(b.name));
        
        text += `*${cfg.emoji} 『${cfg.label.toUpperCase()}』 ${cfg.emoji}*\n`;
        text += `╭────────────❀\n`;
        
        for (const cmd of cmds) {
          text += `│• \`${prefix}${cmd.name}\`\n`;
          
          // Subcommands check (e.g., .challenge start, .fill gender)
          const subs = Array.isArray(cmd.subcommands) && cmd.subcommands.length ? cmd.subcommands : [];
          if (subs.length) {
            text += `│ ┗⊱ *${subs.join(' • ')}*\n`;
          }
        }
        text += `╰─────────────\n`;
      }

      text += `\n*🌙 Moonlight* | ${ownerName}\n`;
      text += `> _*TIP:* use \`.support\` to get my support community`;

      const menuImage = config.MENU_IMAGE; // Premium Tensura/Fantasy BG

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
