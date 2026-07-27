const { suspendUser, normalizeTarget, getUserByTarget } = require('../../utils/modTools');
const { mentionTag } = require('../../handlers/_shared');

moon({
  name: "ban",
  category: "owner",
  roles: ["Owner", "True Owner", "Mod", "CDC"],
  description: "Ban a user globally (auto-removes from groups)",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      let target = args[0];

      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }

      if (!target) {
        return reply("❌ Tag, reply, or provide the number of the user to ban.");
      }

      const targetUser = await getUserByTarget(target, true);
      if (!targetUser) return reply("❌ User not found.");

      // PROTECT STAFF
      const protectedRoles = ["Owner", "True Owner", "Mod", "CDC"];
      if (protectedRoles.includes(targetUser.role)) {
        return reply("❌ You cannot ban a staff member (Owner/Mod/CDC).");
      }

      const reason = args.slice(1).join(" ") || "Violating bot rules";
      const senderTag = mentionTag(sender);
      const targetTag = mentionTag(targetUser.whatsappNumber);

      const result = await suspendUser(targetUser.whatsappNumber, 0, reason, senderTag);

      if (result.ok) {
        // Attempt to remove from current group immediately
        if (jid.endsWith("@g.us")) {
          try {
            await sock.groupParticipantsUpdate(jid, [targetUser.whatsappNumber], "remove");
          } catch {}
        }

        return await sock.sendMessage(jid, {
          text: `🚫 *USER BANNED GLOBALLLY* 🚫\n\n👤 Target: ${targetTag}\n👮 Banned by: ${senderTag}\n📄 Reason: ${reason}\n\n> User will be auto-removed from all groups upon sending a message.`,
          mentions: [targetUser.whatsappNumber, sender]
        }, { quoted: m });
      } else {
        return reply(`❌ Failed to ban user: ${result.message}`);
      }

    } catch (err) {
      console.error("BAN CMD ERROR:", err);
      return reply("❌ Error executing ban.");
    }
  }
});
