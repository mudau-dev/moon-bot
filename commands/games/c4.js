const Game = require("../../models/Games");
const { drawC4 } = require("../../utils/Games");

moon({
  name: "c4",
  category: "games",
  description: "Connect 4 Game",
  async execute(sock, jid, sender, args, m, { reply }) {
    const sub = (args[0] || "").toLowerCase();
    let game = await Game.findOne({ jid, gameType: "c4", status: { $ne: "finished" } });

    if (sub === "start") {
      if (game) return reply("❌ A game is already in progress.");
      game = await Game.create({
        jid,
        gameType: "c4",
        status: "waiting",
        players: [{ jid: sender, name: m.pushName || "Player 1" }],
        state: { board: Array(6).fill(null).map(() => Array(7).fill(null)) }
      });
      return reply("✅ C4 Started! Use `.c4 join` to join.");
    }

    if (sub === "join") {
      if (!game) return reply("❌ No game waiting.");
      if (game.players.length >= 2) return reply("❌ Game full.");
      if (game.players.find(p => p.jid === sender)) return reply("❌ Already joined.");

      game.players.push({ jid: sender, name: m.pushName || "Player 2" });
      game.status = "playing";
      game.turn = game.players[0].jid;
      await game.save();

      const buffer = await drawC4(game.state.board);
      return await sock.sendMessage(jid, { 
        image: buffer, 
        caption: `✅ Game Started!\nTurn: @${game.turn.split("@")[0]}\nMove: .m <1-7>`,
        mentions: [game.turn]
      }, { quoted: m });
    }

    return reply("📌 Usage:\n.c4 start\n.c4 join\n.m <1-7>");
  }
});