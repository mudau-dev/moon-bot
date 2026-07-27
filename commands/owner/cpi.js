const axios = require('axios');

/**
 * Card API Integration Command (cpi)
 * 
 * Sub-commands:
 * - info: Get API information
 * - cards: Fetch all cards (first 10)
 * - tier <number>: Filter cards by tier
 * - anime <name>: Filter cards by anime
 * - random: Get a random card
 * - rtier <number>: Get a random card from a specific tier
 */

moon({
  name: "cpi",
  category: "owner",
  roles: ["Owner", "True Owner"],
  description: "Card API Interface for owners",
  subcommands: ["info", "cards", "tier", "anime", "random", "rtier"],
  async execute(sock, jid, sender, args, m, { reply }) {
    const API_BASE = "https://cardapi.eclipse.name.ng/api";
    const sub = args[0]?.toLowerCase();

    if (!sub) {
      return reply(`✨ *CPI COMMAND CENTER* ✨\n\n` +
                   `Available Sub-commands:\n` +
                   `• \`.cpi info\` - API details\n` +
                   `• \`.cpi cards\` - List all cards\n` +
                   `• \`.cpi tier <1-6>\` - Filter by tier\n` +
                   `• \`.cpi anime <name>\` - Filter by anime\n` +
                   `• \`.cpi random\` - Get random card\n` +
                   `• \`.cpi rtier <1-6>\` - Random by tier`);
    }

    try {
      let url = API_BASE;
      let params = {};

      switch (sub) {
        case 'info':
          url = `${API_BASE}`;
          break;
        case 'cards':
          url = `${API_BASE}/cards`;
          break;
        case 'tier':
          const tier = args[1];
          if (!tier) return reply("❌ Usage: .cpi tier <1-6>");
          url = `${API_BASE}/cards`;
          params = { tier };
          break;
        case 'anime':
          const anime = args.slice(1).join(" ");
          if (!anime) return reply("❌ Usage: .cpi anime <name>");
          url = `${API_BASE}/cards`;
          params = { anime };
          break;
        case 'random':
          url = `${API_BASE}/random`;
          break;
        case 'rtier':
          const rtier = args[1];
          if (!rtier) return reply("❌ Usage: .cpi rtier <1-6>");
          url = `${API_BASE}/random`;
          params = { tier: rtier };
          break;
        default:
          return reply("❌ Unknown sub-command. Type `.cpi` to see list.");
      }

      await reply("⏳ Fetching data from Card API...");

      const response = await axios.get(url, { params, timeout: 10000 });
      const data = response.data;

      if (!data) return reply("❌ No data returned from API.");

      // Format response
      if (sub === 'info') {
        return reply(`📡 *API INFO*\n\n` + JSON.stringify(data, null, 2));
      }

      if (sub === 'random' || sub === 'rtier') {
        const card = Array.isArray(data) ? data[0] : data;
        if (!card) return reply("❌ Card not found.");
        
        const caption = `🎴 *CARD FOUND*\n\n` +
                        `• *Name:* ${card.name}\n` +
                        `• *Anime:* ${card.anime}\n` +
                        `• *Tier:* ${card.tier}\n` +
                        `• *ID:* ${card.id || 'N/A'}`;
        
        if (card.image) {
          return sock.sendMessage(jid, { image: { url: card.image }, caption }, { quoted: m });
        }
        return reply(caption);
      }

      // For lists (cards, tier, anime)
      const list = Array.isArray(data) ? data : (data.cards || []);
      if (list.length === 0) return reply("❌ No cards found for this search.");

      let text = `🎴 *CARDS LIST (${Math.min(list.length, 10)})*\n\n`;
      list.slice(0, 10).forEach((c, i) => {
        text += `${i + 1}. *${c.name}* (${c.anime}) - T${c.tier}\n`;
      });
      
      if (list.length > 10) text += `\n_...and ${list.length - 10} more._`;

      return reply(text);

    } catch (err) {
      console.error("CPI ERROR:", err.message);
      return reply(`❌ API Error: ${err.response?.data?.message || err.message}`);
    }
  }
});
