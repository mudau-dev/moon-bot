const Note = require("../../models/athers/Note");

moon({
    name: "note",
    category: "owner",
    roles: ["Owner", "True Owner"],
    description: "Manage owner notes",
    async execute(sock, jid, sender, args, m, { reply }) {
        const sub = (args[0] || "").toLowerCase();

        if (sub === "create") {
            const name = args[1];
            if (!name) return reply("❌ Usage: .note create <name> (reply to a message)");
            
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) return reply("❌ Reply to a message to save it as a note.");

            const content = quoted.conversation || quoted.extendedTextMessage?.text || "No text content";
            const linkMatch = content.match(/https?:\/\/[^\s]+/);
            
            await Note.create({
                ownerId: sender,
                name: name,
                content: content,
                link: linkMatch ? linkMatch[0] : null
            });

            return reply(`✅ Note *${name}* created successfully!`);
        }

        if (sub === "list") {
            const notes = await Note.find({ ownerId: sender });
            if (notes.length === 0) return reply("❌ You have no saved notes.");

            let text = "📝 *YOUR SAVED NOTES* 📝\n\n";
            notes.forEach((n, i) => {
                text += `[${i + 1}] *${n.name}*\n`;
            });
            text += "\nUse *.note <index>* to view a note.";
            return reply(text);
        }

        // Handle .note <index>
        const index = parseInt(sub);
        if (!isNaN(index)) {
            const notes = await Note.find({ ownerId: sender });
            const note = notes[index - 1];
            if (!note) return reply("❌ Note not found.");

            let text = `📝 *NOTE: ${note.name.toUpperCase()}*\n\n`;
            text += `📅 *Created:* ${note.createdAt.toDateString()}\n`;
            text += `📄 *Content:* ${note.content}\n`;
            if (note.link) text += `🔗 *Link Info:* ${note.link}\n`;

            return reply(text);
        }

        return reply("📌 Usage:\n.note create <name>\n.note list\n.note <index>");
    }
});
