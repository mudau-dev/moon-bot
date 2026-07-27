const config = require('../../config');

moon({
  name: "rules",
  alias: ["rule"],
  category: "general",
  description: "View community rules",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const sub = (args[0] || "").toLowerCase();
      const readMore = String.fromCharCode(8206).repeat(4001);

      const rules = [
        {
          title: "🎰 CASINO & GAMBLING",
          rules: [
            "Fair Play: Exploiting any gambling mechanic or script is strictly prohibited.",
            "No Begging: Begging winners for coins or spamming for donations is not allowed.",
            "Loss Responsibility: All gambling losses are final. No refunds for misclicks.",
            "Anti-Scam: Any attempt to rig group events results in a permanent ban.",
            "Addiction Warning: Excessive spamming of gambling commands will lead to economy restrictions."
          ]
        },
        {
          title: "⚔️ LEGACY RPG SYSTEM",
          rules: [
            "No Macro/Scripting: Using automated tools for battles or farming is a bannable offense.",
            "Fair Combat: Exploiting combat glitches to gain unfair advantages is prohibited.",
            "Respect the Grind: Begging staff for stat boosts or item drops is useless.",
            "Trading Integrity: Scaming users during item or unit trades will result in a total inventory wipe."
          ]
        },
        {
          title: "🛡️ GUILDS & REALMS",
          rules: [
            "Guild Decorum: Maintain respect within your guild and towards rival guilds.",
            "Realm Exploits: Using glitches to bypass realm timers or rewards is strictly forbidden.",
            "Leadership: Guild leaders are responsible for their members' actions during events.",
            "Fair Competition: Any form of win-trading or collusion between guilds is prohibited."
          ]
        },
        {
          title: "🎮 GAME ROOM & INTERACTION",
          rules: [
            "Turn Respect: Do not stall games (TTT, WCG, Chess, C4). Be active when it is your turn.",
            "Leaving Games: Use .m leave if you cannot finish a game. Don't leave your opponent hanging.",
            "Fair Play: Using external engines for Chess or Word Chain is discouraged.",
            "Interaction: Keep interactions (slap, kiss, etc.) fun and respectful."
          ]
        },
        {
          title: "🤖 BOT USAGE & ECONOMY",
          rules: [
            "No Spamming: Do not spam commands. Repeatedly sending commands will result in a mute.",
            "Bug Reporting: Report bugs immediately. Exploiting them results in a permanent blacklist.",
            "Alting: Using multiple accounts to farm daily rewards or lottery is strictly forbidden.",
            "RMT: Selling bot coins for real money is a permanent ban offense for all involved."
          ]
        }
      ];

      if (sub === "list") {
        let text = "📜 *MOONLIGHT HAVEN RULES CATEGORIES*\n\n";
        rules.forEach((cat, i) => {
          text += `${i + 1}. *${cat.title}*\n`;
        });
        text += "\n💡 Use `.rules <index>` to view a specific section.";
        return reply(text);
      }

      const index = parseInt(sub);
      if (!isNaN(index) && rules[index - 1]) {
        const section = rules[index - 1];
        let text = `📜 *${section.title}*\n\n`;
        section.rules.forEach(r => {
          text += `• ${r}\n`;
        });
        return reply(text);
      }

      // Default: Show all rules
      let fullText = `📜 *RULES*${readMore}\n🌙 *MOONLIGHT HAVEN — OFFICIAL RULES*\n━━━━━━━━━━━━━━━━━━\n`;
      rules.forEach(section => {
        fullText += `\n*${section.title}*\n`;
        section.rules.forEach(r => {
          fullText += `• ${r}\n`;
        });
        fullText += `━━━━━━━━━━━━━━━━━━\n`;
      });
      fullText += `\n⚠️ *By using MOONLIGHT HAVEN, you agree to all rules listed above.*`;

      await sock.sendMessage(jid, {
        image: { url: config.MOONLIGHT_IMAGE },
        caption: fullText
      }, { quoted: m });

    } catch (err) {
      console.error("Rules cmd error:", err);
      return reply("❌ Failed to load rules.");
    }
  }
});