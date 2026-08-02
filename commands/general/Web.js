const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { getOTP } = require('../../utils/otpStore');

// .webcp — Create web password (only if user has NONE; otherwise redirect to web)
moon({
  name: 'webcp',
  aliases: ['setwebpass'],
  category: 'website',
  description: 'Create your website password. (Use the web to change it later.)',
  usage: '.webcp <password>',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const userNumber = sender.replace(/[^0-9]/g, '');
      const password = args.join(' ').trim();

      if (!password) {
        return reply(
          '❌ *Usage:* `.webcp <password>`\n\n' +
          '> Your password must be at least 6 characters.\n' +
          '> If you already have a password, visit the website to change it using *Forgot Password*.'
        );
      }

      if (password.length < 6) {
        return reply('❌ Password must be at least 6 characters long.');
      }

      let user = await User.findOne({
        $or: [
          { whatsappNumber: sender },
          { userId: userNumber },
          { moonId: userNumber },
          { phoneNumber: userNumber }
        ]
      });

      if (!user) {
        return reply(
          '❌ You are not registered yet.\n' +
          '> Use `.reg` to create your account first.'
        );
      }

      // If user already has a password, block and redirect to web
      if (user.webPassword) {
        return reply(
          '🔒 *You already have a web password set.*\n\n' +
          '> To change your password, use the *Forgot Password* option on the website.\n' +
          '> You can reset it via OTP — request it on the web, then use `.otp` here.'
        );
      }

      // Ensure moonId is set to phone number
      user.moonId = userNumber;
      user.webPassword = await bcrypt.hash(password, 10);
      user.webPasswordUpdatedAt = new Date();
      await user.save();

      // Delete the command message for security
      try {
        await sock.sendMessage(jid, { delete: m.key });
      } catch (_) {}

      return await sock.sendMessage(jid, {
        text:
          '🌙 *MOONLIGHT HAVEN*\n' +
          '─────────────『❀』\n' +
          '✅ *Web password created successfully!*\n\n' +
          '🆔 *Moon ID:* `' + user.moonId + '`\n' +
          '─────────────『❀』\n' +
          '> Use your *Moon ID* and password to log in on the website.\n' +
          '> To change your password later, use *Forgot Password* on the web.',
        mentions: [sender]
      }, { quoted: m });

    } catch (err) {
      console.error('[WEBCP ERROR]', err);
      return reply('❌ Failed to save your website password.');
    }
  }
});

// .webp / .moonid — Show your web account info
moon({
  name: 'webp',
  aliases: ['moonid'],
  category: 'website',
  description: 'Shows your Moonlight Haven website account.',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const userNumber = sender.replace(/[^0-9]/g, '');

      let user = await User.findOne({
        $or: [
          { whatsappNumber: sender },
          { userId: userNumber },
          { moonId: userNumber },
          { phoneNumber: userNumber }
        ]
      });

      if (!user) {
        return reply(
          '❌ You do not have an account.\n' +
          '> Use `.reg` to register, then `.webcp <password>` to set your web password.'
        );
      }

      if (!user.moonId || user.moonId.includes('@')) {
        user.moonId = userNumber;
        await user.save();
      }

      return reply(
        '🌙 *MOONLIGHT HAVEN WEB*\n' +
        '─────────────『❀』\n' +
        '🆔 *MOON ID:*\n' +
        '`' + user.moonId + '`\n' +
        '🔐 *Website Password:*\n' +
        (user.webPassword ? '✅ Created' : '❌ Not Created') + '\n' +
        '─────────────『❀』\n' +
        '> Use your Moon ID and password to log in on the website.\n' +
        '> *TIP:* Use `.webcp <password>` to create your password.\n' +
        '> To change password, use *Forgot Password* on the web.'
      );
    } catch (err) {
      console.error('[WEBP ERROR]', err);
      return reply('❌ Failed to load your website profile.');
    }
  }
});

// .otp — Get your OTP code for password reset (requested from the web)
moon({
  name: 'otp',
  category: 'website',
  description: 'Get your OTP code for password reset on the website.',
  usage: '.otp',
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const userNumber = sender.replace(/[^0-9]/g, '');
      
      // Use the async getOTP from database-backed store
      const otpCode = await getOTP(userNumber);

      if (!otpCode) {
        return reply(
          '❌ *No OTP request found.*\n\n' +
          '> To reset your password:\n' +
          '1. Go to the website and click *Forgot Password*\n' +
          '2. Enter your number/ID and press *Confirm*\n' +
          '3. Come back here and type `.otp`\n' +
          '4. Enter the OTP on the website'
        );
      }

      // Re-fetch user to get expiry time
      const user = await User.findOne({ moonId: userNumber });
      const timeLeft = user?.otpExpires ? Math.ceil((new Date(user.otpExpires).getTime() - Date.now()) / 1000) : 0;

      try {
        await sock.sendMessage(jid, { delete: m.key });
      } catch (_) {}

      return await sock.sendMessage(jid, {
        text:
          '🔐 *MOONLIGHT HAVEN — OTP*\n' +
          '─────────────『❀』\n' +
          '🔑 *Your OTP Code:*\n' +
          '`' + otpCode + '`\n' +
          '⏳ *Expires in:* ' + timeLeft + 's\n' +
          '─────────────『❀』\n' +
          '> Enter this code on the website to reset your password.\n' +
          '> *Do NOT share this code with anyone.*',
      }, { quoted: m });

    } catch (err) {
      console.error('[OTP ERROR]', err);
      return reply('❌ Failed to retrieve your OTP.');
    }
  }
});
