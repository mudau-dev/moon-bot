const User = require("../../models/User");
const { findOrCreateWhatsApp } = require("../../database/users");

moon({
  name: "register",
  aliases: ["reg"],
  category: "general",
  description: "Register your Moonlight Haven account.",
  async execute(sock, jid, sender, args, m, { reply, pushName }) {
    try {
      const userNumber = sender.split('@')[0];

      // Fetch or create user
      const user = await findOrCreateWhatsApp(sender, pushName || "Unknown");

      // Check if already fully registered (moonId = their number, not a temp moon_ id)
      const isRegistered = user && user.moonId && !user.moonId.startsWith("moon_");

      if (isRegistered) {
        // Already registered — show their profile card
        let profileText =
          `🌙 *MOONLIGHT HAVEN*\n` +
          `─────────────『❀』\n` +
          `✅ *You are already registered!*\n\n` +
          `👤 *Name:* ${user.username || pushName || "Unknown"}\n` +
          `🆔 *Moon ID:* \`${user.moonId}\`\n` +
          `🔐 *Web Password:* ${user.webPassword ? "✅ Set" : "❌ Not Set"}\n` +
          `─────────────『❀』\n` +
          `> Use \`.webcp\` to create your web password.`;

        const profileImage = user.profileImage || user.avatarUrl || null;
        if (profileImage) {
          try {
            return await sock.sendMessage(jid, {
              image: { url: profileImage },
              caption: profileText,
            }, { quoted: m });
          } catch {}
        }
        return reply(profileText);
      }

      // Not registered — set moonId to their phone number
      user.moonId = userNumber;
      if (!user.username || user.username === "Unknown") {
        user.username = pushName || "Unknown";
      }
      await user.save();

      // Build registration card
      let regText =
        `🌙 *MOONLIGHT HAVEN*\n` +
        `─────────────『❀』\n` +
        `✅ *Registration Successful!*\n\n` +
        `👤 *Name:* ${user.username}\n` +
        `🆔 *Moon ID:* \`${user.moonId}\`\n` +
        `📊 *Status:* Active\n` +
        `─────────────『❀』\n` +
        `> Use \`.webcp\` to create your website password.\n` +
        `> Welcome to Moonlight Haven! 🎉`;

      // Try to fetch user profile picture
      let profilePic = null;
      try {
        profilePic = await sock.profilePictureUrl(sender, 'image');
      } catch {}

      if (profilePic) {
        user.avatarUrl = profilePic;
        await user.save();
        try {
          return await sock.sendMessage(jid, {
            image: { url: profilePic },
            caption: regText,
          }, { quoted: m });
        } catch {}
      }

      return reply(regText);
    } catch (err) {
      console.error("[REG ERROR]", err);
      return reply("❌ Failed to register your account. Please try again.");
    }
  }
});

// ── Show unregistered card ────────────────────────────────────────────────────
moon({
  name: "whois",
  aliases: ["myid"],
  category: "general",
  description: "Check if you are registered in Moonlight Haven.",
  async execute(sock, jid, sender, args, m, { reply, pushName }) {
    try {
      const userNumber = sender.split('@')[0];
      const user = await User.findOne({
        $or: [
          { whatsappNumber: sender },
          { userId: userNumber },
          { moonId: userNumber }
        ]
      });

      const isRegistered = user && user.moonId && !user.moonId.startsWith("moon_");

      let cardText;
      if (!isRegistered) {
        cardText =
          `🌙 *MOONLIGHT HAVEN*\n` +
          `─────────────『❀』\n` +
          `❌ *User is not registered in Moonlight*\n\n` +
          `👤 *Name:* ${pushName || "Unknown"}\n` +
          `📊 *Status:* Unregistered\n` +
          `─────────────『❀』\n` +
          `> Use \`.reg\` to register your account.`;
      } else {
        cardText =
          `🌙 *MOONLIGHT HAVEN*\n` +
          `─────────────『❀』\n` +
          `✅ *Registered Member*\n\n` +
          `👤 *Name:* ${user.username || pushName || "Unknown"}\n` +
          `🆔 *Moon ID:* \`${user.moonId}\`\n` +
          `📊 *Status:* ${user.suspended ? "⛔ Suspended" : "✅ Active"}\n` +
          `─────────────『❀』\n` +
          `> Use \`.webcp\` to create your web password.`;
      }

      let profilePic = null;
      try {
        profilePic = await sock.profilePictureUrl(sender, 'image');
      } catch {}

      if (profilePic) {
        try {
          return await sock.sendMessage(jid, {
            image: { url: profilePic },
            caption: cardText,
          }, { quoted: m });
        } catch {}
      }
      return reply(cardText);
    } catch (err) {
      console.error("[WHOIS ERROR]", err);
      return reply("❌ Failed to check registration.");
    }
  }
});
