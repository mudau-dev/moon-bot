const KickRequest = require('../models/athers/KickRequest');
const config = require('../config');

/**
 * Handles cross-bot community management tasks.
 * Checks for pending kick requests and executes them if this bot is an admin.
 */
async function startCommunityManager(sock) {
  setInterval(async () => {
    try {
      const requests = await KickRequest.find({ status: 'pending' });
      if (requests.length === 0) return;

      const communityId = process.env.COMMUNITY;
      if (!communityId) return;

      const metadata = await sock.groupMetadata(communityId).catch(() => null);
      if (!metadata) return;

      const botJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const botIsAdmin = metadata.participants.find(p => p.id === botJid)?.admin;

      if (!botIsAdmin) return;

      for (const req of requests) {
        try {
          await sock.groupParticipantsUpdate(communityId, [req.targetJid], "remove");
          req.status = 'completed';
          req.executorBot = (config.BOT_NAME || "Unknown");
          await req.save();
          
          // Notify the requester
          await sock.sendMessage(req.requesterJid, { 
            text: `✅ [${req.executorBot}] has successfully kicked the target from the community as you requested.` 
          });
        } catch (e) {
          console.error("COMMUNITY KICK EXECUTION ERROR:", e.message);
        }
      }
    } catch (err) {
      // Silent fail for interval
    }
  }, 10000); // Check every 10 seconds
}

module.exports = { startCommunityManager };
