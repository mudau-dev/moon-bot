const Game = require("../../models/Games");
const { isValidWord, drawTTT, drawC4 } = require("../../utils/Games");

moon({
  name: "wcg",
  category: "games",
  description: "Word Chain Game",
  async execute(sock, jid, sender, args, m, { reply }) {
    const sub = (args[0] || "").toLowerCase();
    let game = await Game.findOne({ jid, gameType: "wcg", status: { $ne: "finished" } });

    if (sub === "start") {
      if (game) return reply("❌ A game is already in progress.");
      game = await Game.create({
        jid,
        gameType: "wcg",
        status: "waiting",
        players: [{ jid: sender, name: m.pushName || "Player 1" }],
        state: { words: [], lastLetter: "" }
      });
      return reply("✅ WCG Started! Use `.wcg join` to join. Need at least 2 players.");
    }

    if (sub === "join") {
      if (!game) return reply("❌ No game waiting.");
      if (game.status !== "waiting") return reply("❌ Game already started.");
      if (game.players.find(p => p.jid === sender)) return reply("❌ Already joined.");
      
      game.players.push({ jid: sender, name: m.pushName || "Player" });
      if (game.players.length >= 2) {
        game.status = "playing";
        game.turn = game.players[0].jid;
        await game.save();
        return reply(`✅ Game Started!\nTurn: @${game.turn.split("@")[0]}\nRules: Reply with a word starting with any letter (first turn).`, { mentions: [game.turn] });
      }
      await game.save();
      return reply(`✅ Joined! (${game.players.length}/2)`);
    }

    return reply("📌 Usage:\n.wcg start\n.wcg join\n.m <word>");
  }
});

moon({
  name: "m",
  category: "games",
  description: "Make a move in the current game",
  async execute(sock, jid, sender, args, m, { reply }) {
    const sub = (args[0] || "").toLowerCase();
    
    // Find active game where sender is a player
    const game = await Game.findOne({ 
      jid, 
      status: "playing", 
      "players.jid": sender 
    });

    if (!game) return reply("❌ You are not in an active game in this group.");

    if (sub === "leave") {
      game.status = "finished";
      game.winner = game.players.find(p => p.jid !== sender)?.jid || "No one";
      await game.save();
      return reply(`👋 @${sender.split("@")[0]} has left the game. Game Over!`, { mentions: [sender] });
    }

    if (game.turn !== sender) return reply("❌ It's not your turn!");

    const move = (args[0] || "").toLowerCase();
    if (!move) return reply("❌ Please provide a move.");

    // --- WCG LOGIC ---
    if (game.gameType === "wcg") {
      const { words, lastLetter } = game.state;
      if (lastLetter && !move.startsWith(lastLetter)) return reply(`❌ Word must start with "${lastLetter.toUpperCase()}"`);
      if (words.includes(move)) return reply("❌ Word already used!");
      
      const valid = await isValidWord(move);
      if (!valid) return reply("❌ Not a real word!");

      words.push(move);
      const newLastLetter = move.slice(-1);
      game.state = { words, lastLetter: newLastLetter };
      
      const currentIndex = game.players.findIndex(p => p.jid === sender);
      const nextIndex = (currentIndex + 1) % game.players.length;
      game.turn = game.players[nextIndex].jid;
      
      await game.save();
      return reply(`✅ Nice! Next word starts with "${newLastLetter.toUpperCase()}"\nTurn: @${game.turn.split("@")[0]}`, { mentions: [game.turn] });
    }

    // --- TTT LOGIC ---
    if (game.gameType === "ttt") {
      const pos = parseInt(move) - 1;
      if (isNaN(pos) || pos < 0 || pos > 8) return reply("❌ Move must be 1-9.");
      if (game.state.board[pos]) return reply("❌ Position already taken!");

      const symbol = game.players[0].jid === sender ? "X" : "O";
      game.state.board[pos] = symbol;
      game.markModified("state.board");

      // Check Win
      const winPatterns = [
        [0,1,2], [3,4,5], [6,7,8], // Rows
        [0,3,6], [1,4,7], [2,5,8], // Cols
        [0,4,8], [2,4,6]           // Diagonals
      ];
      
      let winner = null;
      for (const p of winPatterns) {
        if (game.state.board[p[0]] && game.state.board[p[0]] === game.state.board[p[1]] && game.state.board[p[0]] === game.state.board[p[2]]) {
          winner = sender;
          break;
        }
      }

      if (winner) {
        game.status = "finished";
        game.winner = winner;
        await game.save();
        const buffer = await drawTTT(game.state.board);
        return await sock.sendMessage(jid, { image: buffer, caption: `🎉 @${winner.split("@")[0]} WON!`, mentions: [winner] }, { quoted: m });
      }

      if (!game.state.board.includes(null)) {
        game.status = "finished";
        await game.save();
        const buffer = await drawTTT(game.state.board);
        return await sock.sendMessage(jid, { image: buffer, caption: "🤝 It's a DRAW!" }, { quoted: m });
      }

      const currentIndex = game.players.findIndex(p => p.jid === sender);
      const nextIndex = (currentIndex + 1) % game.players.length;
      game.turn = game.players[nextIndex].jid;
      
      await game.save();
      const buffer = await drawTTT(game.state.board);
      return await sock.sendMessage(jid, { 
        image: buffer, 
        caption: `✅ Move accepted!\nTurn: @${game.turn.split("@")[0]}`,
        mentions: [game.turn]
      }, { quoted: m });
    }
  }
});