moon({
  name: "charity",
  category: "economy",
  description: "Donate money to charity",

  async execute(sock, jid, sender, args, m, { findOrCreateWhatsApp, reply, pushName }) {
    try {

      const amount = parseInt(args[0]);

      if (!amount || isNaN(amount) || amount <= 0) {
        return reply("❌ Usage: *.charity <amount>*");
      }

      const user = await findOrCreateWhatsApp(sender, pushName);
      if (!user) return reply("❌ Database error.");

      // SAFE NORMALIZATION (THIS FIXES YOUR ERROR)
      let balance = Number(user.balance) || 0;
      let bank = Number(user.bank) || 0;

      const totalFunds = balance + bank;

      if (totalFunds < amount) {
        return reply("❌ You don't have enough money to donate that much.");
      }

      let remaining = amount;

      // TAKE FROM BALANCE FIRST
      if (balance >= remaining) {
        balance -= remaining;
        remaining = 0;
      } else {
        remaining -= balance;
        balance = 0;
      }

      // THEN BANK
      if (remaining > 0) {
        bank -= remaining;
      }

      // FINAL SAFETY CLAMP (prevents negative DB values)
      user.balance = Math.max(0, balance);
      user.bank = Math.max(0, bank);

      await user.save();

      return reply(
`❤️ CHARITY DONATION

Thank you for donating $${amount.toLocaleString()} to charity 🕊️`
      );

    } catch (err) {
      console.error("CHARITY error:", err);
      return reply("❌ Charity donation failed.");
    }
  }
});