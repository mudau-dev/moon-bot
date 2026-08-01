const User = require("../models/User");

// ---------------- CACHE ----------------
const userCache = new Map();
const CACHE_TTL = 60000;

function setCache(key, user) {
  userCache.set(key, user);
  setTimeout(() => {
    userCache.delete(key);
  }, CACHE_TTL);
}

// ---------------- CORE FUNCTION ----------------
async function findOrCreateWhatsApp(whatsappNumber, username = "Unknown", bypassCache = false) {
  if (!whatsappNumber) throw new Error("Missing WhatsApp ID");

  // NEW LOGIC: Use the full number (whatsappNumber) instead of split ID
  // whatsappNumber is usually '1234567890@s.whatsapp.net'
  
  // ---------------- CACHE ----------------
  if (!bypassCache) {
    const cached = userCache.get(whatsappNumber);
    if (cached) return cached;
  }

  // ---------------- FIND USER ----------------
  // 1. Try whatsappNumber
  let user = await User.findOne({ whatsappNumber });

  // 2. If not found, try phoneNumber (from web registration)
  if (!user) {
    const digits = whatsappNumber.split("@")[0];
    user = await User.findOne({ 
      $or: [
        { phoneNumber: digits },
        { whatsappNumber: digits }
      ]
    });
    
    if (user) {
      // Link the whatsappNumber to this existing web user
      user.whatsappNumber = whatsappNumber;
      await user.save();
    }
  }

  // ---------------- CREATE USER ----------------
  if (!user) {
    const userId = whatsappNumber.split("@")[0];
    // Use phone number as moonId so users can log in on the web with their number
    const moonId = userId;
    user = await User.create({
      moonId,
      whatsappNumber,
      userId,
      username,
      createdAt: Date.now()
    });
  }

  // ---------------- FIX USER DATA ----------------
  let changed = false;
  if (!user.username || user.username === "Unknown") {
    user.username = username;
    changed = true;
  }
  
  if (changed) {
    await user.save();
  }

  // ---------------- REFRESH USER ----------------
  const freshUser = await User.findOne({ whatsappNumber });

  // ---------------- CACHE ----------------
  setCache(whatsappNumber, freshUser);
  return freshUser;
}

// ---------------- UPDATE USER ----------------
async function updateUser(whatsappNumber, update) {
  const user = await User.findOneAndUpdate(
    { whatsappNumber },
    update,
    { new: true, upsert: true }
  );
  if (user) {
    setCache(whatsappNumber, user);
  }
  return user;
}

// ---------------- INCREMENT ----------------
async function incrementUser(whatsappNumber, update) {
  return updateUser(whatsappNumber, { $inc: update });
}

// ---------------- PERMISSIONS ----------------
async function isTrueOwner(sender) {
  const user = await findOrCreateWhatsApp(sender, undefined, true);
  return user.isTrueOwner === true || user.role === "True Owner";
}

async function isOwner(sender) {
  const user = await findOrCreateWhatsApp(sender, undefined, true);
  return user.isTrueOwner === true || ["Owner", "True Owner"].includes(user.role);
}

async function isMod(sender) {
  const user = await findOrCreateWhatsApp(sender, undefined, true);
  return user.isTrueOwner === true || ["Owner", "True Owner", "Mod"].includes(user.role);
}

async function isCDC(sender) {
  const user = await findOrCreateWhatsApp(sender, undefined, true);
  return user.isTrueOwner === true || user.isCDC === true;
}

module.exports = {
  findOrCreateWhatsApp,
  updateUser,
  incrementUser,
  userCache,
  isTrueOwner,
  isOwner,
  isMod,
  isCDC
};
