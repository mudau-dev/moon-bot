/**
 * commands/general/Reg.js
 * .reg / .register — Register a Moonlight Haven account.
 *
 * The sender JID in Baileys is always in the format:
 *   "2348012345678@s.whatsapp.net"  (individual)
 *   "2348012345678@lid"             (linked device)
 *
 * We extract the phone number digits from the JID, NOT from sock.user.id
 * (which is the bot's own number). This was the root cause of the bug where
 * the bot's ID was being registered instead of the user's number.
 *
 * Auto-registration is intentionally NOT done here — users must explicitly
 * run .reg to get a moonId set. The findOrCreateWhatsApp call in the handler
 * creates a minimal user record but does NOT set moonId until .reg is run.
 */
const User = require("../../models/User");
const { findOrCreateWhatsApp } = require("../../database/users");

/**
 * Extract the phone number from a WhatsApp JID.
 * e.g. "2348012345678@s.whatsapp.net" → "2348012345678"
 */
function extractNumber(jid) {
  if (!jid) return "";
  // Remove everything after @ and any non-digit characters
  return jid.split("@")[0].replace(/[^0-9]/g, "");
}

moon({
  name: "register",
  aliases: ["reg"],
  category: "general",
  description: "Register your Moonlight Haven account.",
  async execute(sock, jid, sender, args, m, { reply, pushName }) {
    try {
      // Extract the user's actual phone number from their JID
      const userNumber = extractNumber(sender);

      if (!userNumber) {
        return reply("❌ Could not determine your phone number. Please try again.");
      }

      // Look up existing user by whatsappNumber or moonId (do NOT auto-create with moonId)
      let user = await User.findOne({
        $or: [
          { whatsappNumber: sender },
          { moonId: userNumber },
          { phoneNumber: userNumber },
        ],
      });

      // If no user record at all, create a minimal one (without moonId set yet)
      if (!user) {
        user = await User.create({
          whatsappNumber: sender,
          userId: userNumber,
          username: pushName || "Unknown",
          createdAt: new Date(),
        });
      }

      // Check if already fully registered (moonId is set to their number)
      const isRegistered = user && user.moonId && !user.moonId.startsWith("moon_");

      if (isRegistered) {
        let profileText =
          `🌙 *MOONLIGHT HAVEN*\n` +
          `─────────────『❀』\n` +
          `✅ *You are already registered!*\n\n` +
          `👤 *Name:* ${user.username || pushName || "Unknown"}\n` +
          `🆔 *Moon ID:* \`${user.moonId}\`\n` +
          `🔐 *Web Password:* ${user.webPassword ? "✅ Set" : "❌ Not Set"}\n` +
          `─────────────『❀』\n` +
          `> Use \`.webcp\` to create your web password.`;

        let profilePic = null;
        try { profilePic = await sock.profilePictureUrl(sender, "image"); } catch {}
        if (profilePic) {
          try {
            return await sock.sendMessage(jid, { image: { url: profilePic }, caption: profileText }, { quoted: m });
          } catch {}
        }
        return reply(profileText);
      }

      // Register: set moonId to the user's phone number
      user.moonId = userNumber;
      user.whatsappNumber = sender;
      if (!user.username || user.username === "Unknown") {
        user.username = pushName || "Unknown";
      }

      // Fetch and save profile picture
      let profilePic = null;
      try { profilePic = await sock.profilePictureUrl(sender, "image"); } catch {}
      if (profilePic) {
        user.avatarUrl = profilePic;
      }

      await user.save();

      const regText =
        `🌙 *MOONLIGHT HAVEN*\n` +
        `─────────────『❀』\n` +
        `✅ *Registration Successful!*\n\n` +
        `👤 *Name:* ${user.username}\n` +
        `🆔 *Moon ID:* \`${user.moonId}\`\n` +
        `📞 *Number:* ${userNumber}\n` +
        `📊 *Status:* Active\n` +
        `─────────────『❀』\n` +
        `> Use \`.webcp\` to create your website password.\n` +
        `> Welcome to Moonlight Haven! 🎉`;

      if (profilePic) {
        try {
          return await sock.sendMessage(jid, { image: { url: profilePic }, caption: regText }, { quoted: m });
        } catch {}
      }
      return reply(regText);
    } catch (err) {
      console.error("[REG ERROR]", err);
      return reply("❌ Failed to register your account. Please try again.");
    }
  },
});

// ── whois / myid ──────────────────────────────────────────────────────────────
moon({
  name: "whois",
  aliases: ["myid"],
  category: "general",
  description: "Check if you are registered in Moonlight Haven.",
  async execute(sock, jid, sender, args, m, { reply, pushName }) {
    try {
      const userNumber = extractNumber(sender);
      const user = await User.findOne({
        $or: [
          { whatsappNumber: sender },
          { moonId: userNumber },
          { phoneNumber: userNumber },
        ],
      });

      const isRegistered = user && user.moonId && !user.moonId.startsWith("moon_");

      let cardText;
      if (!isRegistered) {
        cardText =
          `🌙 *MOONLIGHT HAVEN*\n` +
          `─────────────『❀』\n` +
          `❌ *Not registered in Moonlight*\n\n` +
          `👤 *Name:* ${pushName || "Unknown"}\n` +
          `📞 *Number:* ${userNumber}\n` +
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
          `📞 *Number:* ${userNumber}\n` +
          `📊 *Status:* ${user.suspended ? "⛔ Suspended" : "✅ Active"}\n` +
          `─────────────『❀』\n` +
          `> Use \`.webcp\` to create your web password.`;
      }

      let profilePic = null;
      try { profilePic = await sock.profilePictureUrl(sender, "image"); } catch {}
      if (profilePic) {
        try {
          return await sock.sendMessage(jid, { image: { url: profilePic }, caption: cardText }, { quoted: m });
        } catch {}
      }
      return reply(cardText);
    } catch (err) {
      console.error("[WHOIS ERROR]", err);
      return reply("❌ Failed to check registration.");
    }
  },
});

