const User = require('../../models/User');
const config = require('../../config');

moon({
  name: "cmds",
  category: "owner",
  roles: ["Mod", "Tester", "Owner", "True Owner"],
  description: "Show owner commands and uncategorized commands",

  async execute(sock, jid, sender, args, m, { reply, commands, findOrCreateWhatsApp }) {

    try {

      const user = await findOrCreateWhatsApp(sender, sender.split('@')[0]);

      const allowed = ["Owner", "True Owner", "Mod", "CDC", "Tester"];

      if (!user || !allowed.includes(user.role)) {
        return reply("❌ No permission.");
      }

      if (!commands || typeof commands.values !== "function") {
        return reply("❌ Command system not ready.");
      }

      const ownerCmds = [];
      const noCatCmds = [];

      for (const c of commands.values()) {

        if (!c?.name) continue;

        const cat = (c.category || "").toLowerCase();

        if (cat === "owner") {
          ownerCmds.push(c.name);
        }

        if (!c.category || c.category.trim() === "") {
          noCatCmds.push(c.name);
        }
      }

      const text =
`╭━━★彡 𝕔𝕞𝕕𝕤 彡★━━╮

📌 OWNER COMMANDS
${ownerCmds.length ? ownerCmds.map(v => `• ${v}`).join("\n") : "None"}

━━━━━━━━━━━━━━━

📌 NO CATEGORY COMMANDS
${noCatCmds.length ? noCatCmds.map(v => `• ${v}`).join("\n") : "None"}

╰━━★彡━━━彡★━━╯`;

      if (config.MENU_IMAGE) {
        return sock.sendMessage(jid, {
          image: { url: config.MENU_IMAGE },
          caption: text,
          mentions: [sender]
        }, { quoted: m });
      }

      return reply(text);

    } catch (err) {
      console.error("cmds error:", err);
      return reply("❌ Error loading cmds.");
    }
  }
});