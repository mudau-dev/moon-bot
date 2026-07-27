const User = require("../../models/User");
const { findOrCreateWhatsApp } = require("../../database/users");

moon({
  name: "update",
  category: "general",
  description: "Update your profile to the new number-based system",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const userId = sender.split("@")[0];
      const whatsappNumber = sender;

      // 1. Find all potential profiles for this user
      // Profiles that have the correct userId but NO whatsappNumber field, or a different one
      const oldProfiles = await User.find({
        userId: userId,
        $or: [
          { whatsappNumber: { $exists: false } },
          { whatsappNumber: null },
          { whatsappNumber: { $ne: whatsappNumber } }
        ]
      });

      // Filter out the current active profile if it was accidentally caught
      const oldUser = oldProfiles.find(u => u.whatsappNumber !== whatsappNumber);

      if (!oldUser) {
        return reply("✅ Your profile is already up to date or no old data was found.");
      }

      await reply("🔄 *Updating your profile...*\n> Fetching cards, coins, and stats from old ID-based system.");

      // 2. Find or create the new profile
      let newUser = await User.findOne({ whatsappNumber });
      
      if (!newUser) {
          // If no new profile exists, we can just upgrade the old one
          oldUser.whatsappNumber = whatsappNumber;
          await oldUser.save();
          return reply("✅ *UPDATE COMPLETE*\n\nYour profile has been migrated to the new number-based system.\nAll cards, coins, and stats are preserved.");
      }

      // 3. Both exist, merge oldUser into newUser and delete oldUser
      await reply("📦 *Merging data...*");
      
      // Merge Balance
      newUser.balance = (newUser.balance || 0) + (oldUser.balance || 0);
      newUser.bank = (newUser.bank || 0) + (oldUser.bank || 0);
      
      // Merge Cards
      if (Array.isArray(oldUser.cards) && oldUser.cards.length > 0) {
          newUser.cards = [...(newUser.cards || []), ...oldUser.cards];
      }
      
      // Merge other stats
      if (oldUser.stars) newUser.stars = (newUser.stars || 0) + (oldUser.stars || 0);
      if (oldUser.totalEarned) newUser.totalEarned = (newUser.totalEarned || 0) + (oldUser.totalEarned || 0);
      if (oldUser.messageCount) newUser.messageCount = (newUser.messageCount || 0) + (oldUser.messageCount || 0);

      // Save new user
      newUser.markModified("cards");
      await newUser.save();

      // Delete old user to prevent duplicates
      await User.deleteOne({ _id: oldUser._id });

      return reply(
`✅ *UPDATE SUCCESSFUL*

👤 *User:* @${userId}
💰 *Wallet Merged:* ${oldUser.balance || 0}
🏦 *Bank Merged:* ${oldUser.bank || 0}
🎴 *Cards Merged:* ${oldUser.cards?.length || 0}

Your profile is now fully migrated to the new system.`,
        { mentions: [sender] }
      );

    } catch (err) {
      console.error("UPDATE CMD ERROR:", err);
      return reply("❌ Failed to update profile. Please contact an admin.");
    }
  }
});
