const { findOrCreateWhatsApp } = require("../../database/users");

moon({
  name: "otag",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Set owner tagging response (Sticker or Media/Text)",
  usage: ".otag s (reply to sticker) | .otag mp <url> <text> | .otag text <message> | .otag clear",
  async execute(sock, jid, sender, args, m, { reply, downloadMediaMessage }) {
    try {
      const user = await findOrCreateWhatsApp(sender);
      const sub = (args[0] || "").toLowerCase();

      if (sub === "s") {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                       m.message?.stickerMessage;
        
        // If it's a direct sticker message or a reply to a sticker
        const stickerMsg = m.message?.stickerMessage || quoted?.stickerMessage;
        
        if (!stickerMsg) return reply("❌ Please reply to a sticker with .otag s");
        
        // We need to pass the actual message object that contains the sticker
        const target = m.message?.stickerMessage ? m : { message: { stickerMessage: stickerMsg } };
        const stickerBuffer = await downloadMediaMessage(target, "buffer");
        
        if (!stickerBuffer) return reply("❌ Failed to download sticker.");
        
        user.ownerTagType = "sticker";
        user.ownerTagData = stickerBuffer.toString("base64");
        user.ownerTagText = null;
        user.ownerTagUrl = null;
        await user.save();
        return reply("✅ Owner tag sticker set! I will react with this sticker whenever you are tagged.");
      }

      if (sub === "mp") {
        const url = args[1];
        const text = args.slice(2).join(" ");
        if (!url || !url.startsWith("http")) {
          return reply("❌ Please provide a valid URL.\nUsage: .otag mp <url> <text>");
        }
        user.ownerTagType = "media";
        user.ownerTagUrl = url;
        user.ownerTagText = text || null;
        user.ownerTagData = null;
        await user.save();
        return reply(`✅ Owner tag media set!\n🔗 URL: ${url}\n📝 Text: ${text || "None"}`);
      }

      if (sub === "text") {
        const text = args.slice(1).join(" ");
        if (!text) return reply("❌ Please provide text for the owner tag.\nUsage: .otag text <message>");
        user.ownerTagType = "text";
        user.ownerTagText = text;
        user.ownerTagData = null;
        user.ownerTagUrl = null;
        await user.save();
        return reply(`✅ Owner tag text set!\n📝 Text: ${text}`);
      }

      if (sub === "clear") {
        user.ownerTagType = null;
        user.ownerTagData = null;
        user.ownerTagText = null;
        user.ownerTagUrl = null;
        await user.save();
        return reply("✅ Owner tag response cleared.");
      }

      return reply("📌 Usage:\n.otag s (reply to sticker)\n.otag mp <url> <text>\n.otag text <message>\n.otag clear");
    } catch (err) {
      console.error("OTAG CMD ERROR:", err);
      return reply("❌ Failed to set owner tag response.");
    }
  },
});
