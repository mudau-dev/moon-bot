// utils/otpStore.js
// Database-backed OTP store shared by bot and web.
// OTPs expire after 4 minutes.

const User = require('../models/User');

const OTP_TTL = 4 * 60 * 1000; // 4 minutes

/**
 * Generate and store a new OTP for a user in the database.
 * @param {string} userNumber - The phone number digits
 * @returns {Promise<{ otp: string, expiresAt: number }>}
 */
async function createOTP(userNumber) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL);

  // Find user by moonId (phone number) or whatsappNumber
  const user = await User.findOneAndUpdate(
    { 
      $or: [
        { moonId: userNumber },
        { phoneNumber: userNumber },
        { whatsappNumber: new RegExp(userNumber) }
      ]
    },
    { 
      $set: { 
        otp, 
        otpExpires: expiresAt 
      } 
    },
    { new: true }
  );

  if (!user) {
    throw new Error("User not found in database.");
  }

  return { otp, expiresAt: expiresAt.getTime() };
}

/**
 * Get the current valid OTP for a user.
 * @param {string} userNumber
 * @returns {Promise<string|null>}
 */
async function getOTP(userNumber) {
  const user = await User.findOne({
    $or: [
      { moonId: userNumber },
      { phoneNumber: userNumber },
      { whatsappNumber: new RegExp(userNumber) }
    ]
  });

  if (!user || !user.otp || !user.otpExpires) return null;

  // Check if expired
  if (new Date(user.otpExpires) < new Date()) {
    // Clear expired OTP
    await User.updateOne({ _id: user._id }, { $set: { otp: null, otpExpires: null } });
    return null;
  }

  return user.otp;
}

/**
 * Verify and clear an OTP.
 * @param {string} userNumber
 * @param {string} otp
 * @returns {Promise<boolean>}
 */
async function verifyOTP(userNumber, otp) {
  const currentOtp = await getOTP(userNumber);
  if (!currentOtp || currentOtp !== otp) return false;

  // Clear after successful verification
  await User.updateOne(
    { 
      $or: [
        { moonId: userNumber },
        { phoneNumber: userNumber },
        { whatsappNumber: new RegExp(userNumber) }
      ]
    }, 
    { $set: { otp: null, otpExpires: null } }
  );
  return true;
}

module.exports = {
  createOTP,
  getOTP,
  verifyOTP
};
