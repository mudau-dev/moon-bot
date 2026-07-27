const User = require('../../models/User');
const { addMoney } = require('../../utils/economy');

function resolveTarget(m, args) {
  const ctx = m.message?.extendedTextMessage?.contextInfo;

  const mentioned = ctx?.mentionedJid?.[0];
  const replied = ctx?.participant;

  let fromArg = null;

  if (args[0]) {
    if (args[0].includes('@s.whatsapp.net')) {
      fromArg = args[0];
    } else if (/^\d+$/.test(args[0])) {
      fromArg = args[0] + '@s.whatsapp.net';
    }
  }

  return mentioned || replied || fromArg || null;
}

moon({
  name: 'gv',
  category: 'owner',
  roles: ["Owner", "True Owner"],
  description: 'Give money to a user (DB owner only)',
  usage: '.gv @user <amount>',

  async execute(sock, jid, sender, args, m, { reply, findOrCreateWhatsApp }) {
    try {

      // ---------------- OWNER CHECK ----------------
   
      // ---------------- TARGET ----------------
      const target = resolveTarget(m, args);

      if (!target) {
        return reply("❌ Usage: .gv @user <amount>");
      }

      // ---------------- AMOUNT ----------------
      const amount = parseInt(args.find(a => /^\d+$/.test(a)));

      if (!amount || amount <= 0) {
        return reply("❌ Please provide a valid amount.");
      }

      // ---------------- USER ----------------
      const user = await findOrCreateWhatsApp(target, target.split('@')[0]);

      const credited = addMoney(user, amount);

      user.totalEarned = (user.totalEarned || 0) + credited;

      await user.save();

      return reply(
        `✅ Successfully given $${credited.toLocaleString()} to @${target.split('@')[0]}`,
        { mentions: [target] }
      );

    } catch (err) {
      console.error('GV command error:', err);
      return reply('❌ Failed due to system error.');
    }
  }
});