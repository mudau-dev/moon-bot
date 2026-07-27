const { findOrCreateWhatsApp } = require("../database/users");
const config = require("../config");

async function handleOwnerTag(sock, m, body = "") {
  try {
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    // Get the actual message object safely
    const msg = m.message?.extendedTextMessage || m.message?.imageMessage || m.message?.videoMessage || m.message?.conversation || m.message;
    if (!msg) return;

    const mentions = msg.contextInfo?.mentionedJid || [];

    // ----------------------------
    // Bot Name Reaction
    // ----------------------------
    if (body) {
      const botNameRegex = new RegExp(`\\b${config.BOT_NAME}\\b`, "i");
      if (botNameRegex.test(body)) {
        const senderUser = await findOrCreateWhatsApp(sender);
        const isPrivileged =
          senderUser?.isTrueOwner ||
          ["True Owner", "Owner", "Mod", "Tester"].includes(senderUser?.role);
        await sock.sendMessage(
          jid,
          {
            text: isPrivileged
              ? "hello my lord how can i help u"
              : "what do you want from me baka"
          },
          { quoted: m }
        );
      }
    }

    // ----------------------------
    // No mentions
    // ----------------------------
    if (!mentions.length) return;

    for (const target of mentions) {
      // Ignore self tags
      if (target === sender) continue;

      // Bypass cache to get fresh data
      const userDoc = await findOrCreateWhatsApp(target, undefined, true);
      if (!userDoc) continue;

      // Convert to plain object to access dynamic fields not in the schema
      const user = userDoc.toObject ? userDoc.toObject() : userDoc;

      const isOwner =
        user.isTrueOwner ||
        ["True Owner", "Owner"].includes(user.role);

      if (!isOwner) continue;

      // Access dynamic fields
      const tagType = user.ownerTagType;
      const tagData = user.ownerTagData;
      const tagText = user.ownerTagText;
      const tagUrl  = user.ownerTagUrl;

      if (tagType === "sticker" && tagData) {
        await sock.sendMessage(
          jid,
          {
            sticker: Buffer.from(tagData, "base64")
          },
          { quoted: m }
        );
      } else if (tagType === "media" && tagUrl) {
        await sock.sendMessage(
          jid,
          {
            image: { url: tagUrl },
            caption: tagText || ""
          },
          { quoted: m }
        );
      } else if (tagType === "text" && tagText) {
        await sock.sendMessage(
          jid,
          {
            text: tagText
          },
          { quoted: m }
        );
      } else {
        // Default fallback
        await sock.sendMessage(
          jid,
          {
            text: "Don't tag my owner!"
          },
          { quoted: m }
        );
      }
      
      // Only respond once per message
      break;
    }
  } catch (err) {
    console.error("[OWNER TAG ERROR]", err);
  }
}

module.exports = handleOwnerTag;