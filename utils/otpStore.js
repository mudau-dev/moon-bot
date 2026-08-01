// utils/otpStore.js
// Shared in-memory OTP store used by both the web API and the .otp bot command.
// OTPs expire after 4 minutes (240,000 ms).

const OTP_TTL = 4 * 60 * 1000; // 4 minutes

const store = new Map(); // { userNumber: { otp, expiresAt } }

/**
 * Generate and store a new OTP for a user number.
 * @param {string} userNumber - The user's phone number (digits only, no @s.whatsapp.net)
 * @returns {{ otp: string, expiresAt: number }}
 */
function createOTP(userNumber) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_TTL;
  store.set(userNumber, { otp, expiresAt });
  // Auto-clean after TTL
  setTimeout(() => {
    const entry = store.get(userNumber);
    if (entry && entry.expiresAt <= Date.now()) {
      store.delete(userNumber);
    }
  }, OTP_TTL + 1000);
  return { otp, expiresAt };
}

/**
 * Verify an OTP for a user number.
 * @param {string} userNumber
 * @param {string} otp
 * @returns {{ valid: boolean, reason?: string }}
 */
function verifyOTP(userNumber, otp) {
  const entry = store.get(userNumber);
  if (!entry) return { valid: false, reason: 'NOT_FOUND' };
  if (Date.now() > entry.expiresAt) {
    store.delete(userNumber);
    return { valid: false, reason: 'EXPIRED' };
  }
  if (entry.otp !== String(otp)) return { valid: false, reason: 'WRONG_OTP' };
  store.delete(userNumber); // Single-use
  return { valid: true };
}

/**
 * Get a pending OTP entry (for the bot .otp command to display).
 * @param {string} userNumber
 * @returns {{ otp: string, expiresAt: number } | null}
 */
function getOTP(userNumber) {
  const entry = store.get(userNumber);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(userNumber);
    return null;
  }
  return entry;
}

module.exports = { createOTP, verifyOTP, getOTP, store };
