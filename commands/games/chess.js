const Game = require("../../models/Games");

moon({
  name: "chess",
  category: "games",
  description: "Chess Game",
  async execute(sock, jid, sender, args, m, { reply }) {
    const sub = (args[0] || "").toLowerCase();
    let game = await Game.findOne({ jid, gameType: "chess", status: { $ne: "finished" } });

    if (sub === "start") {
      if (game) return reply("❌ A game is already in progress.");
      game = await Game.create({
        jid,
        gameType: "chess",
        status: "waiting",
        players: [{ jid: sender, name: m.pushName || "Player 1" }],
        state: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" }
      });
      return reply("✅ Chess Started! Use `.chess join` to join. Max 2 players.");
    }

    if (sub === "join") {
      if (!game) return reply("❌ No game waiting.");
      if (game.players.length >= 2) return reply("❌ Game full.");
      if (game.players.find(p => p.jid === sender)) return reply("❌ Already joined.");

      game.players.push({ jid: sender, name: m.pushName || "Player 2" });
      game.status = "playing";
      game.turn = game.players[0].jid; // White starts
      await game.save();

      const url = `https://www.chesslink.com/fen/${encodeURIComponent(game.state.fen)}.png`;
      return await sock.sendMessage(jid, { 
        image: { url }, 
        caption: `✅ Game Started!\nTurn: @${game.turn.split("@")[0]} (White)\nMove: .m <move> (e.g., e2e4)`,
        mentions: [game.turn]
      }, { quoted: m });
    }

    return reply("📌 Usage:\n.chess start\n.chess join\n.m <move>");
  }
});