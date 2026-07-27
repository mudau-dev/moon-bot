const User = require('../../models/User');

moon({
  name: 'setname',
  category: 'economy',
  description: 'Set your display name',

  async execute(sock, jid, sender, args, m, db) {
    const name = args.join(' ').trim();

    if (!name) {
      return sock.sendMessage(jid, {
        text: '❌ Usage: .setname <your name>'
      });
    }

    try {
      // Find user by WhatsApp number
      let user = await User.findOne({ whatsappNumber: sender });

      if (!user) {
        return sock.sendMessage(jid, {
          text: '❌ You need to link your account first using .link'
        });
      }

      // Save name
      user.username = name;
      await user.save();

      return sock.sendMessage(jid, {
        text: `✅ Your display name has been set to: *${name}*`
      });

    } catch (err) {
      console.error('Setname error:', err);

      return sock.sendMessage(jid, {
        text: '❌ Failed to set name.'
      });
    }
  }
});

moon({
  name: 'setage',
  category: 'economy',
  description: 'Set your age',

  async execute(sock, jid, sender, args, m, { reply, findOrCreateWhatsApp }) {
    try {
      const age = Number(args[0]);

      if (!Number.isInteger(age)) {
        return reply('❌ Enter a valid number.');
      }

      if (age < 11 || age > 50) {
        return reply('❌ Age must be between 11 and 50.');
      }

      const user = await findOrCreateWhatsApp(sender);

      await user.updateOne({
        age: age
      });

      return reply(`✅ Age set to ${age}`);

    } catch (err) {
      console.error("setage error:", err);
      return reply('❌ Failed to set age.');
    }
  }
});


moon({
  name: 'setbio',
  category: 'economy',
  aliases: ['bio'],
  description: 'Set your profile bio',
  usage: '.setbio <text>',

  async execute(sock, jid, sender, args, m, { reply, findOrCreateWhatsApp, pushName }) {
    try {
      let bio = args.join(' ');

      const context = m.message?.extendedTextMessage?.contextInfo;

      if (!bio && context?.quotedMessage) {
        bio =
          context.quotedMessage.conversation ||
          context.quotedMessage.extendedTextMessage?.text;
      }

      if (!bio) {
        return reply(
          '❌ Please provide a bio.\nExample: .setbio I am a Moonlight user'
        );
      }

      if (bio.length > 150) {
        return reply('❌ Bio too long. Max 150 characters.');
      }

      const user = await findOrCreateWhatsApp(sender, pushName);

      if (!user) {
        return reply('❌ User not found.');
      }

      await user.updateOne({
        bio: bio
      });

      return reply(`✅ Bio updated successfully:\n\n"${bio}"`);

    } catch (err) {
      console.error('setbio error:', err);
      return reply('❌ Failed to set bio.');
    }
  }
});