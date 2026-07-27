moon({
    name: "menup",
    category: "Pokémon",
    description: "List all Pokémon commands",
    async execute(sock, jid, sender, args, m, { reply, replyWithImage, config, commands }) {
        const prefix = config?.PREFIX || ".";
        const pokeCmds = Array.from(commands.values())
            .filter(cmd => cmd.category === "Pokémon")
            .filter((cmd, index, self) => self.findIndex(c => c.name === cmd.name) === index);

        let menuText = `🌟 *POKÉMON COMMANDS* 🌟\n\n`;
        
        pokeCmds.forEach(cmd => {
            const name = cmd.name ? cmd.name.toString() : "unknown";
            const desc = cmd.description ? cmd.description.toString() : "No description";
            menuText += `• *${prefix}${name}*\n> ${desc}\n\n`;
        });

        const menuImage = config?.MENU_IMAGE || "https://files.catbox.moe/c9cl5l.jpg";
        return replyWithImage(menuImage, menuText);
    }
});
