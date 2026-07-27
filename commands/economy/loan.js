const User = require("../../models/User");

const TIER_LIMITS = {
  Common: 50000,
  Uncommon: 80000,
  Rare: 200000,
  Epic: 350000,
  Legendary: 700000,
  Mythic: 2000000
};

moon({
  name: "loan",
  category: "economy",
  description: "Loan system using cards as collateral",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const userId = sender.split("@")[0];
      const user = await User.findOne({ userId });
      if (!user) return reply("❌ User not found.");

      const sub = (args[0] || "").toLowerCase();

      if (sub === "request") {
        const amount = Number(args[1]);
        const cardIndex = Number(args[2]) - 1;
        if (!amount || amount <= 0) return reply("❌ Usage: .loan request <amount> <card index>");
        
        if (isNaN(cardIndex) || !user.cards || !user.cards[cardIndex]) return reply("❌ Invalid card index.");
        if (user.loan?.amount > 0) return reply("❌ You already have an active loan. Repay it first.");

        const card = user.cards[cardIndex];
        const limit = TIER_LIMITS[card.rarity] || TIER_LIMITS[card.tier] || 1000;
        if (amount > limit) return reply(`❌ ${card.rarity || card.tier} cards can only secure loans up to $${limit.toLocaleString()}.`);

        const interest = Math.ceil(amount * 0.10);
        const totalRepayment = amount + interest;

        // Take the card from the user
        const collateral = { ...card };
        user.cards.splice(cardIndex, 1);
        user.balance += amount;
        user.loan = {
          amount: totalRepayment,
          originalAmount: amount,
          interest,
          collateralCard: collateral,
          cardId: card.cardId,
          cardName: card.name,
          cardTier: card.rarity || card.tier,
          requestedAt: new Date()
        };
        await user.save();

        return reply(`🏦 *LOAN APPROVED*\n\n💰 Loan: $${amount.toLocaleString()}\n📈 Interest: $${interest.toLocaleString()} (10%)\n💳 Total Due: $${totalRepayment.toLocaleString()}\n\n🎴 Collateral Taken: ${card.name}\n⭐ Rarity: ${card.rarity || card.tier}\n\n> Your card has been taken as collateral until the loan is repaid.`);
      }

      if (sub === "repay" || sub === "pay") {
        if (!user.loan?.amount) return reply("❌ You have no active loan.");
        if (user.balance < user.loan.amount) return reply(`❌ Insufficient balance. You need $${(user.loan.amount - user.balance).toLocaleString()} more.`);

        const collateralCard = user.loan.collateralCard;
        user.balance -= user.loan.amount;
        if (!Array.isArray(user.cards)) user.cards = [];
        
        if (collateralCard) {
          user.cards.push(collateralCard);
        }
        
        user.loan = undefined;
        await user.save();
        return reply(`✅ Loan repaid successfully.\n\n🎴 ${collateralCard?.name || "Your card"} has been returned to your collection.`);
      }

      if (sub === "status") {
        if (!user.loan?.amount) return reply("ℹ️ You currently have no active loan.");
        return reply(`🏦 *LOAN STATUS*\n\n💳 Amount Due: $${user.loan.amount.toLocaleString()}\n💰 Original Loan: $${(user.loan.originalAmount || 0).toLocaleString()}\n📈 Interest: $${(user.loan.interest || 0).toLocaleString()}\n🎴 Collateral: ${user.loan.cardName || "Unknown"}\n⭐ Rarity: ${user.loan.cardTier || "Unknown"}\n📅 Requested: ${new Date(user.loan.requestedAt).toLocaleDateString()}`);
      }

      return reply(`💸 *Loan Command Usage*\n• *.loan request <amount> <card index>* — Request a loan.\n• *.loan repay/pay* — Repay your current loan.\n• *.loan status* — Check your active loan details.\n\n*Per-Tier Maximums*\n• Common: up to 50K\n• Uncommon: up to 80K\n• Rare: up to 200K\n• Epic: up to 350K\n• Legendary: up to 700K\n• Mythic: up to 2M`);
    } catch (err) {
      console.error("LOAN ERROR:", err);
      return reply("❌ Loan system error.");
    }
  }
});
