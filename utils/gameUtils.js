const User = require('../models/User');

const activeGames = new Map();

const gameUtils = {
  activeGames,

  // Check if a user is in any active game
  isInGame(userId) {
    for (const [key, game] of activeGames) {
      if (game.players.includes(userId)) return true;
    }
    return false;
  },

  // Get game by user ID
  getGame(userId) {
    for (const [key, game] of activeGames) {
      if (game.players.includes(userId)) return game;
    }
    return null;
  },

  // Create a new game session
  createGame(id, type, players, data = {}) {
    const game = {
      id,
      type,
      players,
      status: 'pending', // pending, active, finished
      turn: players[0],
      createdAt: Date.now(),
      lastMoveAt: Date.now(),
      ...data
    };
    activeGames.set(id, game);
    return game;
  },

  // End a game and update stats
  async endGame(id, winnerId = null, isDraw = false) {
    const game = activeGames.get(id);
    if (!game) return;

    if (isDraw) {
      for (const p of game.players) {
        await User.findOneAndUpdate(
          { $or: [{ whatsappNumber: p }, { userId: p.split('@')[0] }] },
          { $inc: { 'games.draws': 1 } }
        );
      }
    } else if (winnerId) {
      const loserId = game.players.find(p => p !== winnerId);
      
      // Update winner
      const winField = `games.${game.type}Wins`;
      await User.findOneAndUpdate(
        { $or: [{ whatsappNumber: winnerId }, { userId: winnerId.split('@')[0] }] },
        { 
          $inc: { 
            'games.wins': 1,
            [winField]: 1,
            balance: game.bet ? game.bet : 0
          } 
        }
      );

      // Update loser
      if (loserId) {
        await User.findOneAndUpdate(
          { $or: [{ whatsappNumber: loserId }, { userId: loserId.split('@')[0] }] },
          { 
            $inc: { 
              'games.losses': 1,
              balance: game.bet ? -game.bet : 0
            } 
          }
        );
      }
    }

    activeGames.delete(id);
  },

  // Challenge logic
  async challenge(sock, jid, sender, target, type, bet = 0) {
    if (this.isInGame(sender)) return "❌ You are already in a game!";
    if (this.isInGame(target)) return "❌ The opponent is already in a game!";
    if (sender === target) return "❌ You cannot challenge yourself!";

    const gameId = `${type}_${jid}_${sender}_${target}`;
    this.createGame(gameId, type, [sender, target], { bet, jid });

    const betText = bet > 0 ? `\n💰 *Wager:* $${bet.toLocaleString()}` : "";
    return `🎮 *${type.toUpperCase()} CHALLENGE* 🎮\n\n@${sender.split('@')[0]} challenged @${target.split('@')[0]} to a game of ${type}!${betText}\n\nReply with *.accept* to start or *.decline* to cancel.`;
  }
};

module.exports = gameUtils;
