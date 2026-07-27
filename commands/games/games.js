const config = require("../../config");

moon({
  name: "games",
  category: "games",
  description: "Get rules and guide for games",
  async execute(sock, jid, sender, args, m, { reply }) {
    const text = `🎮 *MOONLIGHT GAMES* 🎮

1️⃣ *WCG (Word Chain Game)*
- .wcg start: Start a new game
- .wcg join: Join the game (min 2 players)
- .m <word>: Reply with a word starting with the last letter of the previous word.

2️⃣ *TTT (Tic-Tac-Toe)*
- .ttt start: Start a new game
- .ttt join: Join the game (max 2 players)
- .m <1-9>: Place your mark on the board.

3️⃣ *Chess*
- .chess start: Start a new game
- .chess join: Join the game (max 2 players)
- .m <move>: Move your piece (e.g., e2e4).

4️⃣ *C4 (Connect 4)*
- .c4 start: Start a new game
- .c4 join: Join the game
- .m <1-7>: Drop your disc in a column.

💡 *General Move Command:* Use \`.m <move>\` to play your turn in any active game.`;

    return await sock.sendMessage(jid, {
      image: { url: config.MENU_IMAGE },
      caption: text
    }, { quoted: m });
  }
});