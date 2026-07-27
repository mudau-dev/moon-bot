moon({
  name: "eventgroup",
  aliases: ["egc"],
  category: "event",
  description: "Get the Moonlight Festival event group link",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const groupLink = "https://chat.whatsapp.com/HQB6ikDyWqhKKmLDixZqvY?s=cl&p=a&mlu=1&amv=3";
      
      const text = `
┌─❖
│ 「 🌙 MOONLIGHT FESTIVAL 」
└┬❖ 「 ⚔️ EVENT GROUP 」
   │──────────────
   │ Join the official event group 
   │ to participate in the Moonlight 
   │ Festival!
   │──────────────
   │ 🔗 ${groupLink}
   │──────────────
   │ All event commands 
   │ (.mg, .challenge, .start, etc.)
   └────────────┈ ⳹`.trim();

      return await sock.sendMessage(jid, {
        text: text,
        contextInfo: {
          externalAdReply: {
            title: "Haven Festival",
            body: "Group chat invite",
            thumbnailUrl: "https://i.ibb.co/L50k8fW/haven-festival.jpg",
            sourceUrl: groupLink,
            mediaType: 1,
            renderLargerThumbnail: true // BIG PREVIEW CARD
          }
        }
      }, { quoted: m });
    } catch (err) {
      console.error("EVENTGROUP CMD ERROR:", err);
      return reply("❌ Error sending group link.");
    }
  }
});
