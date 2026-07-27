const User = require('../../models/User');
const bcrypt = require('bcryptjs');

function randomMoonId() {
  return 'MH-' + Math.floor(10000000 + Math.random() * 90000000);
}

moon({
  name: 'webcp',
  aliases: ['setwebpass'],
  category: 'website',
  description: 'Create or change your website password.',
  usage: '.webcp <password>',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const password = args.join(' ').trim();

      if (!password) {
        return reply('❌ Usage: \`.webcp <password>\`');
      }

      if (password.length < 6) {
        return reply('❌ Password must be at least 6 characters long.');
      }

      const userId = sender.split('@')[0];

      let user = await User.findOne({
        $or: [
          { whatsappNumber: sender },
          { userId }
        ]
      });

      if (!user) {
        return reply('❌ You do not have an account.');
      }

      // Create Moon ID if needed
      if (!user.moonId) {
        let moonId;

        while (true) {
          moonId = randomMoonId();

          const exists = await User.findOne({ moonId });
          if (!exists) break;
        }

        user.moonId = moonId;
      }

      const changed = !!user.webPassword;

      user.webPassword = await bcrypt.hash(password, 10);
      user.webPasswordUpdatedAt = new Date();

      await user.save();

      // Delete the command message
      try {
        await sock.sendMessage(jid, {
          delete: m.key
        });
      } catch {}

      await sock.sendMessage(jid, {
        text:
`🌙 *MOONLIGHT HAVEN*

> @${userId}, your website password has been ${changed ? 'changed' : 'created'} successfully.
🆔 *Moon ID:*
\`${user.moonId}\`
> Use your Moon ID and password to log in on the website.`,
        mentions: [sender]
      });

    } catch (err) {
      console.error(err);
      return reply('❌ Failed to save your website password.');
    }
  }
});


function randomMoonId() {
  return 'MH-' + Math.floor(10000000 + Math.random() * 90000000);
}

moon({
  name: 'webp',
  aliases: ['moonid'],
  category: 'website',
  description: 'Shows your Moonlight Haven website account.',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const userId = sender.split('@')[0];

      let user = await User.findOne({
        $or: [
          { whatsappNumber: sender },
          { userId }
        ]
      });

      if (!user) {
        return reply('❌ You do not have an account.create one using \`.webcp\`');
      }

      // Create Moon ID if missing
      if (!user.moonId) {
        let moonId;

        while (true) {
          moonId = randomMoonId();

          const exists = await User.findOne({ moonId });
          if (!exists) break;
        }

        user.moonId = moonId;
        await user.save();
      }

      return reply(
`🌙 *MOONLIGHT HAVEN WEB*
─────────────『❀』
🆔 *MOON ID:*    
\`${user.moonId}\`
🔐 *Website Password:*
${user.webPassword ? "✅ Created" : "❌ Not Created"}
─────────────『❀』
> Use your Moon ID and password to log in on the website.
> *TIP:* to change or create you password usege: \`.webcp\``
      );

    } catch (err) {
      console.error(err);
      return reply('❌ Failed to load your website profile.');
    }
  }
});