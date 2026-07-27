// ================= LIMITS =================
const MAX_WIN_PER_TRADE = 5000000000000000;
const MAX_BALANCE = Infinity; // removes artificial cap

// ================= ADD MONEY =================
function addMoney(user, amount) {
  if (!user.balance) user.balance = 0;
  if (!user.totalEarned) user.totalEarned = 0;

  // Cap winnings per transaction
  const win = Math.min(amount, MAX_WIN_PER_TRADE);

  user.balance += win;
  user.totalEarned += win;

  // Optional safety clamp (won’t actually limit since Infinity)
  if (user.balance > MAX_BALANCE) {
    user.balance = MAX_BALANCE;
  }

  return win;
}

// ================= REMOVE MONEY =================
function removeMoney(user, amount) {
  if (!user.balance) user.balance = 0;
  if (!user.totalLost) user.totalLost = 0;

  const loss = Math.abs(amount);

  user.balance -= loss;
  user.totalLost += loss;

  if (user.balance < 0) user.balance = 0;

  return loss;
}

// ================= BET LIMIT CHECK =================
function canBet(amount) {
  const MAX_BET = 20000000000000;
  return amount <= MAX_BET;
}

// ================= EXPORTS =================
module.exports = {
  addMoney,
  removeMoney,
  canBet,
  MAX_WIN_PER_TRADE,
  MAX_BALANCE
};