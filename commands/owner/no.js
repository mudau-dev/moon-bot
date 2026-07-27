const User = require("../../models/User");
const { userNumber } = require("../../utils/functions");

moon({
  name: "no",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Demote all admins and optionally kick them",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith("@g.us")) return reply("❌ Group only.");
      
      const sub = args[0]?.toLowerCase();
      const groupMetadata = await sock.groupMetadata(jid);
      const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
      
      const targets = [];
      for (const adminId of admins) {
        const num = adminId.split("@")[0];
        const user = await User.findOne({ $or: [{ userId: num }, { whatsappNumber: num }] });
        // Protect high roles
        if (user && ["Mod", "Owner", "True Owner"].includes(user.role)) continue;
        targets.push(adminId);
      }

      await reply("As you wish my lord. Processing you wish...");

      if (sub === "k") {
        if (targets.length > 0) {
          await sock.groupParticipantsUpdate(jid, targets, "demote");
          const mentions = targets;
          await sock.sendMessage(jid, { 
            text: `⚠️ @${targets.map(id => id.split("@")[0]).join(" @")}\nYou have 15 seconds to say your last goodbye!`,
            mentions
          });

          setTimeout(async () => {
            try {
              await sock.groupParticipantsUpdate(jid, targets, "remove");
              await sock.sendMessage(jid, { text: "✅ Task complete. Kicked all demoted admins." });
            } catch (e) {
              console.error("KICK ERROR:", e);
            }
          }, 15000);
        } else {
          await reply("✅ No unprotected admins found to kick.");
        }
      } else {
        if (targets.length > 0) {
          await sock.groupParticipantsUpdate(jid, targets, "demote");
        }
        // Check if sender is already admin before promoting
        const isSenderAdmin = admins.includes(sender);
        if (!isSenderAdmin) {
          await sock.groupParticipantsUpdate(jid, [sender], "promote");
        }
        await reply("✅ All unprotected admins have been demoted. You are now the admin.");
      }
    } catch (err) {
      console.error("NO COMMAND ERROR:", err);
      // Don't reply "Failed" if it actually worked partially
    }
  }
});
