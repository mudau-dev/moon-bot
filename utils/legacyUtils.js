const LegacyPlayer = require('../models/LegacyPlayer');

/**
 * Find a LegacyPlayer by sender JID.
 * genesis creates the record with whatsappId = moonId (phone number),
 * but the bot passes the full JID (number@s.whatsapp.net).
 * So we try both.
 */
async function findLegacyPlayer(sender) {
  const userNumber = sender.split('@')[0];
  return LegacyPlayer.findOne({
    $or: [
      { whatsappId: sender },
      { whatsappId: userNumber },
    ]
  });
}

module.exports = { findLegacyPlayer };
