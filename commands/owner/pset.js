const User = require('../../models/User');

function resolveTarget(args, m) {
  const ctx = m.message?.extendedTextMessage?.contextInfo;

  const mentioned = ctx?.mentionedJid?.[0];
  const replied = ctx?.participant;

  const raw = args[1];
  let fromArg = null;

  if (raw && /^\d+$/.test(raw)) {
    fromArg = raw + '@s.whatsapp.net';
  }

  return mentioned || replied || fromArg || null;
}

moon({
  name: 'pset',
  category: 'owner',
  roles: ["Mod", "Owner", "True Owner"],
  description: 'Set user profile (name, age, bio, images)',

  async execute(sock, jid, sender, args, m, { reply, findOrCreateWhatsApp }) {
    try {

      // ---------------- DB OWNER CHECK ONLY ----------------
      const senderNumber = sender.split('@')[0];

      const senderUser = await findOrCreateWhatsApp(sender, senderNumber);

      if (!senderUser || (senderUser.role !== "Owner" && senderUser.role !== "True Owner")) {
        return reply("❌ You don't have permission to do that");
      }

      const type = (args[0] || '').toLowerCase();
      const target = resolveTarget(args, m);

      if (!type || !target) {
        return reply(
`❌ Usage:
.pset name @user <name>
.pset age @user <age>
.pset bio @user <bio>
.pset p @user <image url>
.pset bc @user <image url>`
        );
      }

      const user = await findOrCreateWhatsApp(target, target.split('@')[0]);

      if (!user) {
        return reply("❌ User not found.");
      }

      const value = args.slice(2).join(' ').trim();

      if (!value) {
        return reply("❌ Missing value.");
      }

      // ---------------- NAME ----------------
      if (type === 'name') {
        user.username = value;
      }

      // ---------------- AGE ----------------
      else if (type === 'age') {
        const age = parseInt(value);

        if (isNaN(age) || age < 1) {
          return reply("❌ Invalid age.");
        }

        user.age = age;
      }

      // ---------------- BIO ----------------
      else if (type === 'bio') {
        if (value.length > 150) {
          return reply("❌ Bio too long (max 150 chars).");
        }

        user.bio = value;
      }

      // ---------------- PROFILE IMAGE ----------------
      else if (type === 'p') {
        if (!/^https?:\/\//.test(value)) {
          return reply("❌ Provide a valid image URL.");
        }

        user.profileImage = value;
      }

      // ---------------- BACKGROUND IMAGE ----------------
      else if (type === 'bc') {
        if (!/^https?:\/\//.test(value)) {
          return reply("❌ Provide a valid image URL.");
        }

        user.backgroundImage = value;
      }

      else {
        return reply("❌ Invalid type.");
      }

      await user.save();

      return reply(
`✅ Profile updated

👤 @${target.split('@')[0]}
📌 Field: ${type}
📝 Value: ${value}`,
      { mentions: [target] });

    } catch (err) {
      console.error("pset error:", err);
      return reply("❌ Failed to update profile.");
    }
  }
});