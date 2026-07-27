const GroupSettings = require("../models/athers/GroupSettings");
const { suspendUser } = require("../utils/modTools");
const { checkUserRole } = require("./roleChecker");

module.exports = async function handleGroupEvents(sock, update) {
  try {
    const { id, participants, action } = update;

    if (!id || !id.endsWith("@g.us")) return;
    if (!participants || participants.length === 0) return;

    const group = GroupSettings.getGroup(id);
    const metadata = await sock.groupMetadata(id);

    // ─────────────────────────────
    // UNAUTHORIZED BOT INVITE CHECK
    // ─────────────────────────────
    if (action === "add") {
      const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      if (participants.includes(botId)) {
        // The bot itself was added.
        // Who added it? 'author' field in update
        const inviter = update.author;
        if (inviter) {
          // Check if inviter is allowed (Owner/Mod/True Owner/CDC)
          const { allowed } = await checkUserRole(inviter, ["Mod", "Owner", "True Owner", "CDC"]);
          if (!allowed) {
            // UNAUTHORIZED: Suspend for 25 hours
            const duration = 25 * 60 * 60 * 1000;
            await suspendUser(inviter, duration, "Added bot to group without permission", "system");
            
            // Notify and leave
            await sock.sendMessage(id, { 
              text: `⚠️ *UNAUTHORIZED BOT INVITE* ⚠️\n\nUser @${inviter.split("@")[0]} has been suspended for 25 hours for adding the bot without permission.\n\nLeaving group now...`,
              mentions: [inviter]
            });
            return await sock.groupLeave(id);
          }
        }
      }
    }

    for (const userJid of participants) {
      const isJoin = action === "add";
      const isLeave = action === "remove";

      if (!isJoin && !isLeave) continue;

      const enabled = isJoin ? group.welcomeEnabled : group.leaveEnabled;
      const template = isJoin ? group.welcomeMessage : group.leaveMessage;

      if (!enabled) continue;

      // Build the @mention tag WhatsApp will render as a green clickable mention
      // Format must be @<number> — WhatsApp resolves it from the mentions array
      const userNumber = userJid.split("@")[0];
      const mentionTag = `@${userNumber}`;

      // PROFILE PICTURE SUPPORT (@p)
      const wantsProfilePic = template.includes("@p");

      let text = template
        .replace(/@user/g, mentionTag)          // ← proper @number mention
        .replace(/@gname/g, metadata.subject)
        .replace(/@count/g, metadata.participants.length)
        .replace(/@p/g, "")
        .trim();

      let pp = null;
      if (wantsProfilePic) {
        try {
          pp = await sock.profilePictureUrl(userJid, "image");
        } catch {
          pp = null;
        }
      }

      const messagePayload = {
        mentions: [userJid] // required so WhatsApp renders the @number as a real tag
      };

      if (pp) {
        await sock.sendMessage(id, {
          image: { url: pp },
          caption: text,
          ...messagePayload
        });
      } else {
        await sock.sendMessage(id, {
          text,
          ...messagePayload
        });
      }
    }
  } catch (err) {
    console.error("[GROUP EVENT ERROR]", err);
  }
};
