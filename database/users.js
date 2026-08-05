/**
 * database/users.js
 *
 * findOrCreateWhatsApp: Looks up a user by their WhatsApp JID.
 * IMPORTANT: This function creates a minimal user record if none exists,
 * but it does NOT set moonId. moonId is only set when the user explicitly
 * runs the .reg command. This prevents auto-registration.
 */
const User = require("../models/User");

const userCache = new Map();
const CACHE_TTL = 60000;

function setCache(key, user) {
  userCache.set(key, user);
  setTimeout(() => userCache.delete(key), CACHE_TTL);
}

async function findOrCreateWhatsApp(whatsappNumber, username = "Unknown", bypassCache = false) {
  if (!whatsappNumber) throw new Error("Missing WhatsApp ID");

  if (!bypassCache) {
    const cached = userCache.get(whatsappNumber);
    if (cached) return cached;
  }

  // Extract digits for phone number matching
  const digits = whatsappNumber.replace(/[^0-9]/g, '');

  // Try to find by whatsappNumber first
  let user = await User.findOne({ whatsappNumber });

  // Try by phone number / moonId (web-registered users)
  if (!user && digits) {
    user = await User.findOne({
      $or: [
        { phoneNumber: digits },
        { moonId: digits },
        { whatsappNumber: digits },
      ],
    });
    if (user) {
      // Link the whatsappNumber to this existing web user
      user.whatsappNumber = whatsappNumber;
      await user.save();
    }
  }

  // Create a minimal record — do NOT set moonId here
  // moonId is only set when the user runs .reg
  if (!user) {
    user = await User.create({
      whatsappNumber,
      userId: digits,
      username,
      createdAt: new Date(),
      // moonId intentionally NOT set — user must .reg to get one
    });
  }

  // Update username if it was "Unknown"
  let changed = false;
  if (username && username !== "Unknown" && (!user.username || user.username === "Unknown")) {
    user.username = username;
    changed = true;
  }
  // Fix malformed moonId (should never contain @)
  if (user.moonId && user.moonId.includes('@')) {
    user.moonId = user.moonId.replace(/[^0-9a-zA-Z_-]/g, '');
    changed = true;
  }
  if (changed) await user.save();

  const freshUser = await User.findOne({ whatsappNumber });
  setCache(whatsappNumber, freshUser);
  return freshUser;
}

async function updateUser(whatsappNumber, update) {
  const user = await User.findOneAndUpdate(
    { whatsappNumber },
    update,
    { new: true, upsert: true }
  );
  if (user) setCache(whatsappNumber, user);
  return user;
}

async function incrementUser(whatsappNumber, update) {
  return updateUser(whatsappNumber, { $inc: update });
}

async function isTrueOwner(sender) {
  const user = await findOrCreateWhatsApp(sender, undefined, true);
  return user?.isTrueOwner === true || user?.role === "True Owner";
}

async function isOwner(sender) {
  const user = await findOrCreateWhatsApp(sender, undefined, true);
  return user?.isTrueOwner === true || ["Owner", "True Owner"].includes(user?.role);
}

async function isMod(sender) {
  const user = await findOrCreateWhatsApp(sender, undefined, true);
  return user?.isTrueOwner === true || ["Owner", "True Owner", "Mod"].includes(user?.role);
}

async function isCDC(sender) {
  const user = await findOrCreateWhatsApp(sender, undefined, true);
  return user?.isTrueOwner === true || user?.isCDC === true;
}

module.exports = {
  findOrCreateWhatsApp,
  updateUser,
  incrementUser,
  userCache,
  isTrueOwner,
  isOwner,
  isMod,
  isCDC,
};
