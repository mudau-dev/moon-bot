const User = require('../models/User');
const { findOrCreateWhatsApp, userCache } = require('../database/users');

/**
 * Normalize any target (jid, mention, number)
 */
function normalizeTarget(targetId) {
  const raw = String(targetId || '').trim();

  const userId = raw.replace(/[^0-9]/g, '');
  const whatsappNumber = raw.includes('@')
    ? raw
    : `${userId}@s.whatsapp.net`;

  return { userId, whatsappNumber };
}

/**
 * Fetch user safely
 */
async function getUserByTarget(targetId, createIfMissing = false) {
  const { userId, whatsappNumber } = normalizeTarget(targetId);

  if (!userId) return null;

  let user = await User.findOne({
    $or: [
      { userId },
      { whatsappNumber }
    ]
  });

  if (!user && createIfMissing) {
    user = await findOrCreateWhatsApp(whatsappNumber, userId);
  }

  return user;
}

/**
 * Suspend user (block from all bot commands)
 */
async function suspendUser(targetId, durationMs = 0, reason = "No reason", by = "system") {
  const user = await getUserByTarget(targetId, true);
  if (!user) return { ok: false, message: "User not found" };

  user.suspended = true;
  user.suspendReason = reason;
  user.suspendedBy = by;

  // permanent or timed suspension
  user.suspendUntil = durationMs > 0
    ? new Date(Date.now() + durationMs)
    : null;

  await user.save();

  // FIX: Always clear cache after suspending so the next message
  // does NOT serve a stale (unsuspended) cached user object.
  if (userCache) {
    userCache.delete(user.whatsappNumber);
    userCache.delete(user.userId);
  }

  return { ok: true };
}

/**
 * Unsuspend user
 */
async function unsuspendUser(targetId) {
  const user = await getUserByTarget(targetId, false);
  if (!user) return { ok: false, message: "User not found" };

  user.suspended = false;
  user.suspendReason = null;
  user.suspendedBy = null;
  user.suspendUntil = null;

  await user.save();

  if (userCache) {
    userCache.delete(user.whatsappNumber);
    userCache.delete(user.userId);
  }

  return { ok: true };
}

/**
 * Check suspension status (GLOBAL GUARD)
 * Used by handler/Stetus.js
 *
 * FIX: This function now always queries the database directly (bypasses
 * the userCache). This is intentional — the cache exists for performance
 * on non-security-critical lookups, but suspension is a security gate and
 * must always reflect the true persisted state.
 */
async function checkSuspension(sender) {
  const { userId, whatsappNumber } = normalizeTarget(sender);

  // Always go straight to the DB — never use the cache for suspension checks.
  const user = await User.findOne({
    $or: [
      { userId },
      { whatsappNumber }
    ]
  });

  if (!user || !user.suspended) {
    return { blocked: false };
  }

  // Auto-expire timed suspensions
  if (user.suspendUntil) {
    const now = Date.now();
    const until = new Date(user.suspendUntil).getTime();

    if (now > until) {
      user.suspended = false;
      user.suspendUntil = null;
      user.suspendReason = null;
      user.suspendedBy = null;

      await user.save();

      // Clear cache so the next findOrCreateWhatsApp call gets fresh data
      if (userCache) {
        userCache.delete(user.whatsappNumber);
        userCache.delete(user.userId);
      }

      return { blocked: false };
    }
  }

  // Format remaining time
  let timeLeft = "Permanent";

  if (user.suspendUntil) {
    const diff = new Date(user.suspendUntil).getTime() - Date.now();

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    timeLeft = `${d}d ${h}h ${m}m ${s}s`;
  }

  return {
    blocked: true,
    timeLeft,
    reason: user.suspendReason || "No reason provided"
  };
}

/**
 * Force refresh user cache
 */
async function refreshUser(targetId) {
  const { userId, whatsappNumber } = normalizeTarget(targetId);

  const user = await User.findOne({
    $or: [{ userId }, { whatsappNumber }]
  });

  if (user && userCache) {
    userCache.delete(user.whatsappNumber);
    userCache.delete(user.userId);
  }

  return user;
}

module.exports = {
  suspendUser,
  unsuspendUser,
  checkSuspension,
  getUserByTarget,
  normalizeTarget,
  refreshUser
};
