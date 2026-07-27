const { checkSuspension } = require('../utils/modTools');

/**
 * Handles user suspension check.
 * Now only sends a message if the user is attempting to run a command (isCmd = true).
 * Otherwise, silently blocks the user without spamming the chat.
 */
async function handleSuspension(sock, jid, sender, m, cmdName = "", isCmd = false) {
  // Allow certain utility commands even if suspended
  const allowList = ["rules", "mods"];
  if (allowList.includes(cmdName)) {
    return { blocked: false };
  }

  try {
    const suspension = await checkSuspension(sender);
    
    if (suspension.blocked) {
      // ONLY send the rejection message if it's a command attempt
      if (isCmd) {
        const reason = suspension.reason || "No reason provided";
        await sock.sendMessage(
          jid,
          {
            text:
              `❌ *You are suspended from using our bots.*\n\n` +
              `⏳ *TIME LEFT:* \`${suspension.timeLeft || "Permanent"}\`\n` +
              `📝 *REASON:* ${reason}\n\n` +
              `💡 _If you think this is a mistake, use .mods to contact support._`
          },
          { quoted: m }
        );
      }
      
      // Always return blocked: true to stop further processing
      return { blocked: true };
    }
    
    return { blocked: false };
  } catch (err) {
    console.error("SUSPENSION CHECK ERROR:", err);
    return { blocked: false };
  }
}

module.exports = { handleSuspension };
