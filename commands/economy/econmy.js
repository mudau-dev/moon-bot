const User = require('../../models/User');
const Card = require('../../models/Card');

moon({
  name: "economy",
  aliases: ["eco", "econ"],
  category: "economy",
  description: "View global economy stats",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      const users = await User.find({});

      if (!users.length) {
        return reply("❌ No economy data found.");
      }

      let totalMoney = 0;
      let totalBank = 0;
      let totalCards = 0;

      users.forEach(u => {
        totalMoney += u.balance || 0;
        totalBank += u.bank || 0;
        totalCards += (u.cards?.length || 0);
      });

      const totalUsers = users.length;

      const totalCardsInDB = await Card.countDocuments({});

      const avgWealth = (totalMoney + totalBank) / totalUsers;

      const text =
`📊 *ECONOMY OVERVIEW*

👥 Users: ${totalUsers}

💰 Cash in Circulation: $${totalMoney.toLocaleString()}
🏦 Bank Holdings: $${totalBank.toLocaleString()}
💸 Total Wealth: $${(totalMoney + totalBank).toLocaleString()}

🃏 Total Cards Owned: ${totalCards}
📦 Cards in System: ${totalCardsInDB}

📈 Avg Wealth per User: $${Math.floor(avgWealth).toLocaleString()}

━━━━━━━━━━━━━━━`;

      return reply(text);

    } catch (err) {
      console.error("ECONOMY ERROR:", err);
      return reply("❌ Failed to load economy stats.");
    }
  }
});