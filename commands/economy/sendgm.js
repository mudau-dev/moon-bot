const User = require('../../models/User');
const config = require('../../config');

moon({
  name: "paygm",
  category: "economy",
  description: "Send your diamonds to another user",
  usage: ".paygm @user <amount> OR reply",

  async execute(sock, jid, sender, args, m, { findOrCreateWhatsApp, reply }) {
    try {

      const senderUser = await findOrCreateWhatsApp(sender);

      // ---------------- OWNER CHECK ----------------
      const senderNumber = sender.split('@')[0];
      const admin = await User.findOne({ userId: senderNumber });

      const isOwner = admin?.role === "True Owner";

      // ---------------- TARGET RESOLVER (FIXED) ----------------
      let target = null;

      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;

      if (mentioned?.length) {
        target = mentioned[0];
      }

      if (!target) {
        const ctx = m.message?.extendedTextMessage?.contextInfo;

        target =
          ctx?.participant ||   // reply target (REAL fix)
          m.quoted?.sender ||   // fallback
          null;
      }

      if (!target) {
        return reply("❌ Mention or reply to a user.");
      }

      if (target === sender) {
        return reply("❌ You can't send diamonds to yourself.");
      }

      // ---------------- AMOUNT PARSE FIX ----------------
      const amount = parseInt(args.find(a => /^\d+$/.test(a)));

      if (!amount || isNaN(amount) || amount <= 0) {
        return reply("❌ Provide a valid amount.");
      }

      const targetUser = await findOrCreateWhatsApp(target);

      // ---------------- OWNER MODE (NO DEDUCTION) ----------------
      if (isOwner) {

        await User.updateOne(
          { _id: targetUser._id },
          { $inc: { diamonds: amount } }
        );

      } else {

        const freshSender = await User.findById(senderUser._id);

        if ((freshSender.diamonds || 0) < amount) {
          return reply("❌ Not enough diamonds.");
        }

        await User.updateOne(
          { _id: senderUser._id },
          { $inc: { diamonds: -amount } }
        );

        await User.updateOne(
          { _id: targetUser._id },
          { $inc: { diamonds: amount } }
        );
      }

      const updatedSender = await User.findById(senderUser._id);

      return sock.sendMessage(jid, {
        text:
`💎 *Diamond Transfer*

📤 Sent: ${amount.toLocaleString()}
📥 To: @${target.split('@')[0]}

💰 Your Balance: ${(updatedSender.diamonds || 0).toLocaleString()} diamonds`,
        mentions: [target]
      }, { quoted: m });

    } catch (err) {
      console.error("paygm error:", err);
      reply("❌ Transfer failed.");
    }
  }
});