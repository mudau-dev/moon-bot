/**
 * Moonlight Festival Levels & Rewards
 */

const ROUND_DURATION_MS = 25 * 60 * 60 * 1000; // 25 hours

const LEVELS = [
  {
    index: 1,
    icon: "🎲",
    name: "The Lucky Beginning",
    tasks: ["Win 2 gambles.", "Flip 5 coins."],
    requirements: { gamblesWon: 2, coinsFlipped: 5 },
    rewards: ["💰 5,000 Coins", "🎟 Event Ticket"],
    points: 100
  },
  {
    index: 2,
    icon: "💸",
    name: "Money Never Sleeps",
    tasks: ["Win 5 gambles.", "Earn 10,000 from work."],
    requirements: { gamblesWon: 5 },
    rewards: ["💰 15,000 Coins", "🎟 Silver Ticket"],
    points: 250
  },
  {
    index: 3,
    icon: "🎴",
    name: "Card Hunter",
    tasks: ["Claim 3 cards.", "Win 3 gambles."],
    requirements: { cardsHunted: 3, gamblesWon: 3 },
    rewards: ["💰 25,000 Coins", "📦 Rare Card Pack"],
    points: 500
  },
  {
    index: 4,
    icon: "⚔",
    name: "Rise of the Warrior",
    tasks: ["Win 5 battles.", "Flip 10 coins."],
    requirements: { battlesWon: 5, coinsFlipped: 10 },
    rewards: ["💰 50,000 Coins", "⚔ Warrior Badge"],
    points: 750
  },
  {
    index: 5,
    icon: "🌍",
    name: "World Explorer",
    tasks: ["Send 50 messages.", "Win 10 gambles."],
    requirements: { messagesSent: 50, gamblesWon: 10 },
    rewards: ["💰 100,000 Coins", "🎟 Gold Ticket"],
    points: 1000
  },
  {
    index: 6,
    icon: "🎰",
    name: "Fortune's Choice",
    tasks: ["Win 15 gambles.", "Flip 20 coins."],
    requirements: { gamblesWon: 15, coinsFlipped: 20 },
    rewards: ["💰 250,000 Coins", "🎰 VIP Pass"],
    points: 2000
  },
  {
    index: 7,
    icon: "👥",
    name: "Community Spirit",
    tasks: ["Send 100 messages.", "Win 5 battles."],
    requirements: { messagesSent: 100, battlesWon: 5 },
    rewards: ["💰 500,000 Coins", "📦 Epic Card Pack"],
    points: 3000
  },
  {
    icon: "📦",
    name: "Treasure Master",
    tasks: ["Claim 10 cards.", "Win 20 gambles."],
    requirements: { cardsHunted: 10, gamblesWon: 20 },
    rewards: ["💰 1,000,000 Coins", "💎 Treasure Map"],
    points: 5000
  },
  {
    index: 9,
    icon: "👑",
    name: "Moonlight Elite",
    tasks: ["Win 50 gambles.", "Win 20 battles."],
    requirements: { gamblesWon: 50, battlesWon: 20 },
    rewards: ["💰 5,000,000 Coins", "👑 Elite Title"],
    points: 10000
  },
  {
    index: 10,
    icon: "🌑",
    name: "Eclipse Champion",
    tasks: ["Send 500 messages.", "Win 100 gambles.", "Win 50 battles."],
    requirements: { messagesSent: 500, gamblesWon: 100, battlesWon: 50 },
    rewards: ["💰 10,000,000 Coins", "🏆 Champion Trophy"],
    points: 25000
  }
];

module.exports = { LEVELS, ROUND_DURATION_MS };
