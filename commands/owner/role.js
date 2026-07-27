const User = require("../../models/User");
const { isTrueOwner } = require("../../database/users");
const { userNumber } = require("../../utils/functions");

const ROLE_INDEX_MAP = {
  "1": "Owner",
  "2": "Tester",
  "3": "Mod",
  "4": "True Owner"
};

moon({
  name: "role",
  category: "owner",
  roles: ["True Owner"],
  description: "Manage user roles",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!(await isTrueOwner(sender))) return reply("❌ Only True Owner can use this.");
      
      const sub = args[0]?.toLowerCase();
      if (!["add", "del"].includes(sub)) {
        return reply("❌ Usage:\n.role add @user <index>\n.role del @user\n\nIndices:\n1. Owner\n2. Tester\n3. Mod\n4. True Owner");
      }
      
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const targetId = mentioned ? userNumber(mentioned) : args[1];
      if (!targetId) return reply("❌ Mention a user.");
      
      const targetUser = await User.findOne({ $or: [{ userId: targetId }, { whatsappNumber: targetId }] });
      if (!targetUser) return reply("❌ User not found in database.");
      
      if (sub === "add") {
        const index = args[2] || args[1];
        const newRole = ROLE_INDEX_MAP[index];
        if (!newRole) return reply("❌ Invalid index. Use 1, 2, 3, or 4.");
        targetUser.role = newRole;
        await targetUser.save();
        return reply(`✅ Role for @${targetId} set to *${newRole}*`, { mentions: [`${targetId}@s.whatsapp.net`] });
      }
      
      if (sub === "del") {
        targetUser.role = "User";
        await targetUser.save();
        return reply(`✅ Role for @${targetId} reset to *User*`, { mentions: [`${targetId}@s.whatsapp.net`] });
      }
    } catch (err) {
      console.error("ROLE COMMAND ERROR:", err);
      return reply("❌ Failed to manage role.");
    }
  }
});
