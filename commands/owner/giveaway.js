const Giveaway = require('../../models/athers/Giveaway');
const User = require('../../models/User');

moon({
  name: "gvw",
  category: "owner",
  roles: ["True Owner"],
  description: "Start a giveaway",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      // =========================
      // TRUE OWNER CHECK ONLY
      // =========================
      const senderNumber = sender.split('@')[0];

      const senderUser = await User.findOne({ userId: senderNumber });

      if (!senderUser || senderUser.role !== "True Owner") {
        return reply("❌ You don't have permission to do that");
      }

      if (!args[0]) {
        return reply("❌ Usage: .gvw <amount>");
      }

      const amount = parseInt(args[0]);

      if (!amount || amount <= 0) {
        return reply("❌ Invalid giveaway amount.");
      }

      // =========================
      // ACTIVE GIVEAWAY CHECK
      // =========================
      const existing = await Giveaway.findOne({
        claimed: false,
        expiresAt: { $gt: Date.now() }
      });

      if (existing) {
        return reply("❌ A giveaway is already running.");
      }

      const id = Math.floor(100000 + Math.random() * 900000).toString();
      const duration = 5 * 60 * 1000;

      const gv = new Giveaway({
        id,
        amount,
        createdAt: Date.now(),
        expiresAt: Date.now() + duration,
        claimed: false,
        winner: null
      });

      await gv.save();

      // =========================
      // GET ALL GROUP MEMBERS
      // =========================
      let mentions = [];

      try {
        const meta = await sock.groupMetadata(jid);
        mentions = meta.participants.map(p => p.id);
      } catch (err) {
        console.error("Failed to load members:", err);
      }

      const text = `
🎉 GIVEAWAY STARTED 🎉

💰 Prize: ${amount.toLocaleString()} coins
⏳ Duration: 5 minutes

⚡ First to claim wins

👉 Use:
.cm ${id}
      `.trim();

      await sock.sendMessage(jid, {
        text,
        mentions
      }, { quoted: m });

      // =========================
      // CLEANUP
      // =========================
      setTimeout(async () => {
        await Giveaway.deleteOne({ id, claimed: false });
      }, duration);

    } catch (err) {
      console.error("Giveaway error:", err);
      return reply("❌ You don't have permission to do that");
    }
  }
});