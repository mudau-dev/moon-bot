const { findOrCreateWhatsApp } = require('../../database/users');
const EventProgress = require('../../models/EventProgress');

// CHANGED: MAX_BET from 2,000,000 to 1,000,000
const MAX_BET = 1000000;

function money(n) {
  return Math.floor(Number(n) || 0).toLocaleString();
}

function cleanAmount(raw) {
  if (typeof raw !== 'string') return NaN;
  const normalized = raw.replace(/,/g, '').trim().toLowerCase();
  if (!normalized) return NaN;
  const suffixes = {
    k: 1e3,
    m: 1e6,
    b: 1e9,
    t: 1e12
  };
  const match = normalized.match(/^(\d+(?:\.\d+)?)([kmbt])?$/);
  if (!match) return NaN;
  const amount =
    Number(match[1]) * (suffixes[match[2]] || 1);
  return Math.floor(amount);
}

function parseBet(args, user, index = 0) {
  const raw = String(args[index] || "").toLowerCase();
  if (raw === "all" || raw === "max") {
    return Math.floor(Number(user.balance) || 0);
  }
  if (raw === "half") {
    return Math.floor((Number(user.balance) || 0) / 2);
  }
  return cleanAmount(raw);
}

function validateBet(bet, user) {
  if (!Number.isFinite(bet) || bet <= 0) {
    return "❌ Enter a valid bet amount.";
  }
  if (bet > MAX_BET) {
    return `❌ Max bet is $${money(MAX_BET)}.`;
  }
  if ((Number(user.balance) || 0) < bet) {
    return "❌ You do not have enough coins in your wallet.";
  }
  return null;
}

/* =========================
   WIN CHANCE TABLE
========================= */
function getWinChance(bet) {
  if (bet <= 10000) {
    return 0.95; // 95%
  }
  if (bet <= 100000) {
    return 0.85; // 85%
  }
  if (bet <= 150000) {
    return 0.70; // 70%
  }
  if (bet <= 200000) {
    return 0.65; // 65%
  }
  if (bet <= 250000) {
    return 0.50; // 50%
  }
  if (bet <= 500000) {
    return 0.25; // 25%
  }
  if (bet <= 700000) {
    return 0.15; // 15%
  }
  return 0.10; // 700,001 - 1,000,000
}

function roll(chance) {
  return Math.random() < chance;
}

/* =========================
   USER
========================= */
async function getUser(sender, message) {
  const pushName =
    message?.pushName ||
    message?.verifiedBizName ||
    "User";
  const user =
    await findOrCreateWhatsApp(sender, pushName);
  user.balance = Number(user.balance) || 0;
  user.bank = Number(user.bank) || 0;
  user.totalEarned = Number(user.totalEarned) || 0;
  user.totalLost = Number(user.totalLost) || 0;
  return user;
}

/* =========================
   EVENT STATS
========================= */
async function updateEventStats(userId, type, amount = 1) {
  try {
    EventProgress.findOneAndUpdate(
      { userId },
      {
        $inc: {
          [`stats.${
            type === "gamble"
              ? "gamblesWon"
              : type === "coin"
              ? "coinsFlipped"
              : type === "card"
              ? "cardsHunted"
              : type === "battle"
              ? "battlesWon"
              : "messagesSent"
          }`]: amount
        }
      }
    ).catch(() => {});
  } catch {}
}

/* =========================
   HISTORY
========================= */
function recordHistory(user, type, bet, outcome, amount) {
  if (!user.history) {
    user.history = [];
  }
  user.history.push({
    type,
    bet,
    outcome,
    amount,
    time: new Date()
  });
  if (user.history.length > 20) {
    user.history = user.history.slice(-20);
  }
}

/* =========================
   WIN / LOSE
========================= */
async function win(user, bet, multiplier, cmdName = "gamble") {
  const profit = Math.floor(bet * multiplier);
  user.balance += profit;
  user.totalEarned += profit;
  recordHistory(
    user,
    cmdName,
    bet,
    "win",
    profit
  );
  await user.save();
  updateEventStats(
    user.whatsappNumber || user.userId,
    "gamble",
    1
  );
  return profit;
}

async function lose(user, bet, cmdName = "gamble") {
  user.balance = Math.max(
    0,
    user.balance - bet
  );
  user.totalLost += bet;
  recordHistory(
    user,
    cmdName,
    bet,
    "loss",
    bet
  );
  await user.save();
}

/* =========================
   RANDOM PICK
========================= */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* =========================
   EXPORTS
========================= */
module.exports = {
  MAX_BET,
  money,
  parseBet,
  validateBet,
  getWinChance,
  roll,
  getUser,
  win,
  lose,
  pick,
  recordHistory,
  updateEventStats
};
