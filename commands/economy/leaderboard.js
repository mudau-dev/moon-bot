const User = require('../../models/User');

const ReadMore = String.fromCharCode(8206).repeat(4001);

moon({
  name: "lb",
  category: "economy",
  description: "View economy leaderboard",
  usage: ".lb | .lbg",
  cooldown: 3,
  aliases: ["lb", "top", "rich", "leaderbord", "leaderboard", "lbg", "richg"],

  async execute(sock, jid, sender, args, m, { findOrCreateWhatsApp, reply, pushName }) {

    try {

      await findOrCreateWhatsApp(sender, pushName);

      const isGroup = jid.endsWith('@g.us');

      // =========================
      // 🌍 GLOBAL LEADERBOARD
      // =========================
      if (!["lbg", "richg", "leaderbordg"].includes((args[0] || "").toLowerCase()) && !["lbg", "richg"].includes(m.command)) {

        const users = await User.find({ whatsappNumber: { $ne: null } });

        if (!users.length) {
          return reply("❌ No users found in economy yet.");
        }

        const sorted = users
          .sort((a, b) => {
            const aTotal = (a.balance || 0) + (a.bank || 0);
            const bTotal = (b.balance || 0) + (b.bank || 0);
            return bTotal - aTotal;
          })
          .slice(0, 15);

        let text =
`🏆 *HERE ARE THE TOP 15 RICHEST MEMBERS IN 𝚳OO𝚴𝐋𝚰𝐆𝚮𝚻 H𝚫V𝚵N*
${ReadMore}\n\n`;

        sorted.forEach((u, i) => {
          const total = (u.balance || 0) + (u.bank || 0);

          let name = u.username?.trim();

          if (!name) {
            name = u.whatsappNumber
              ? u.whatsappNumber.replace(/@s\.whatsapp\.net|@lid/g, '')
              : "User";
          }

          text += `${i + 1}. *${name}*\n💰 $${total.toLocaleString()} coins\n\n`;
        });

        return reply(text.trim());
      }

      // =========================
      // 👥 GROUP LEADERBOARD
      // =========================
      if (!isGroup) {
        return reply("❌ This command only works in groups.");
      }

      const groupUsers = await User.find({ whatsappNumber: { $ne: null } });

      const sortedGroup = groupUsers
        .filter(u => u.whatsappNumber && u.whatsappNumber.includes("@s.whatsapp.net"))
        .sort((a, b) => {
          const aTotal = (a.balance || 0) + (a.bank || 0);
          const bTotal = (b.balance || 0) + (b.bank || 0);
          return bTotal - aTotal;
        })
        .slice(0, 6);

      let gtext =
`🏆 *HERE ARE THE TOP 6 RICHEST USER IN THIS CURRENT GROUP*
${ReadMore}\n\n`;

      sortedGroup.forEach((u, i) => {
        const total = (u.balance || 0) + (u.bank || 0);

        let name = u.username?.trim();

        if (!name) {
          name = u.whatsappNumber
            ? u.whatsappNumber.replace(/@s\.whatsapp\.net|@lid/g, '')
            : "User";
        }

        gtext += `${i + 1}. *${name}*\n💰 $${total.toLocaleString()} coins\n\n`;
      });

      return reply(gtext.trim());

    } catch (err) {
      console.error("Leaderboard error:", err);
      return reply("❌ Could not load leaderboard.");
    }
  }
});