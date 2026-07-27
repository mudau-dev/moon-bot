const { findOrCreateWhatsApp } = require('../database/users');

/**
 * roleChecker.js
 * 
 * Hierarchy:
 * User (0) < Tester (1) < Mod (2) < Owner (3) < True Owner (4)
 * 
 * CDC is treated as level 4.
 */

const ROLE_HIERARCHY = {
  "User": 0,
  "Tester": 1,
  "Mod": 2,
  "Owner": 3,
  "True Owner": 4,
  "CDC": 4
};

async function checkUserRole(sender, requiredRoles) {
  if (!requiredRoles || requiredRoles.length === 0) {
    return { allowed: true };
  }

  try {
    const user = await findOrCreateWhatsApp(sender);
    if (!user) {
      return { allowed: false, message: "❌ *ERROR*: User data not found." };
    }

    // Standardize role name
    let userRole = user.role || "User";
    if (userRole === "mod") userRole = "Mod";
    if (userRole === "owner") userRole = "Owner";

    const userLevel = ROLE_HIERARCHY[userRole] || 0;

    // Special flags bypass
    if (user.isTrueOwner || user.isCDC || userRole === "True Owner" || userRole === "CDC") {
      return { allowed: true };
    }

    // Get levels for required roles
    const requiredLevels = requiredRoles.map(r => ROLE_HIERARCHY[r] !== undefined ? ROLE_HIERARCHY[r] : 4);
    const minRequiredLevel = Math.min(...requiredLevels);

    if (userLevel >= minRequiredLevel) {
      return { allowed: true };
    }

    return { 
      allowed: false, 
      message: `❌️ sorry you can't use this command baka...` 
    };

  } catch (err) {
    console.error("[ROLE CHECK ERROR]", err);
    return { allowed: false, message: "❌ Internal permission error." };
  }
}

module.exports = { checkUserRole };
