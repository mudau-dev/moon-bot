const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports = async function createUser(number) {

  const clean = number.replace(/\D/g, "");

  if (!clean) {
    throw new Error("Invalid number");
  }

  let existing = await User.findOne({ number: clean });
  if (existing) return existing;

  const tempPass = Math.random().toString(36).slice(2, 10);
  const hashed = await bcrypt.hash(tempPass, 10);

  const user = await User.create({
    userId: Date.now().toString(),
    number: clean,
    name: "WhatsApp User",
    age: 18,
    password: hashed,
    balance: 1000,
    wallet: 0,
    inventory: [],
    cards: [],
    isRegistered: true
  });

  return { user, tempPass };
};