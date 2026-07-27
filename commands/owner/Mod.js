const config = require('../../config');
const User = require('../../models/User');

function resolveTarget(args, m) {
  const ctx = m.message?.extendedTextMessage?.contextInfo;

  const mentioned = ctx?.mentionedJid?.[0];
  const replied = ctx?.participant;

  const arg = args.slice(1).join(' ').trim();

  let fromArg = null;

  if (arg) {
    if (arg.includes('@s.whatsapp.net')) {
      fromArg = arg;
    } else if (/^\d+$/.test(arg)) {
      fromArg = arg + '@s.whatsapp.net';
    }
  }

  return mentioned || replied || fromArg || null;
}

moon({
  name: 'mod',
  category: 'owner',
  roles: ["Owner", "True Owner"],
  description: 'Manage moderators',
  usage: '.mod set/del @user | number | reply',

  async execute(sock, jid, sender, args, m, { reply, findOrCreateWhatsApp }) {
    try {

      // ---------------- DB OWNER CHECK ----------------
      const senderNumber = sender.split('@')[0];

      const senderUser =
        await findOrCreateWhatsApp(sender, senderNumber);

      if (
        !senderUser ||
        (senderUser.role !== "Owner" &&
         senderUser.role !== "True Owner")
      ) {
        return reply("❌ You don't have permission to do that");
      }

      const action = (args[0] || '').toLowerCase();
      const target = resolveTarget(args, m);

      if (!target) {
        return reply(
`❌ Usage:
.mod set @user / number / reply
.mod del @user / number / reply`
        );
      }

      const user = await findOrCreateWhatsApp(
        target,
        target.split('@')[0]
      );

      if (!user) {
        return reply("❌ User not found.");
      }

      const targetNumber = target.split('@')[0];

      // ---------------- SET MOD ----------------
      if (action === 'set') {

        if (
          user.role === 'True Owner' ||
          user.role === 'Owner'
        ) {
          return reply("❌ You cannot modify an owner");
        }

        user.role = 'Mod';
        await user.save();

        return reply(
`🛡️ *Moderator Added*

👤 @${targetNumber}
Status: Promoted to Mod`,
        { mentions: [target] });
      }

      // ---------------- REMOVE MOD ----------------
      if (action === 'del') {

        if (user.role !== 'Mod') {
          return reply("❌ This user is not a moderator.");
        }

        user.role = 'User';
        await user.save();

        return reply(
`⚠️ *Moderator Removed*

👤 @${targetNumber}
Status: Demoted to User`,
        { mentions: [target] });
      }

      return reply(
`❌ Usage:
.mod set @user
.mod del @user`
      );

    } catch (err) {
      console.error("mod error:", err);
      return reply("❌ Failed to update moderator.");
    }
  }
});