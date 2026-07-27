const axios = require("axios");

const chatMemory = new Map();

async function handleChatBot(sock, msg, body, config) {
    try {
        const BOT_NAME = (config.BOT_NAME || "Bot").toLowerCase();
        const botJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";

        const message =
            msg.message?.extendedTextMessage ||
            msg.message?.imageMessage ||
            msg.message?.videoMessage ||
            {};

        const context = message.contextInfo || {};

        const mentioned = context.mentionedJid || [];

        const isTagged = mentioned.includes(botJid);

        const isReply =
            context.participant === botJid ||
            context.remoteJid === botJid;

        const startsWithName = body
            .toLowerCase()
            .startsWith(BOT_NAME);

        if (!isTagged && !isReply && !startsWithName) return;

        let prompt = body;

        if (startsWithName) {
            prompt = body.slice(BOT_NAME.length).trim();
        }

        if (isTagged) {
            prompt = prompt.replace(/@\d+/g, "").trim();
        }

        if (!prompt) {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "How can I help you?"
                },
                { quoted: msg }
            );
        }

        const user =
            msg.key.participant ||
            msg.key.remoteJid;

        if (!chatMemory.has(user))
            chatMemory.set(user, []);

        const history = chatMemory.get(user);

        history.push({
            role: "User",
            text: prompt
        });

        if (history.length > 10)
            history.shift();

        const conversation = history
            .map(x => `${x.role}: ${x.text}`)
            .join("\n");

        const { data } = await axios.get(
            "https://api-rebix.vercel.app/api/gpt-5",
            {
                params: {
                    q: conversation
                },
                timeout: 60000
            }
        );

        console.log("AI RESPONSE:", data);

        const reply =
            data.data ||
            data.result ||
            data.response ||
            data.answer ||
            data.message ||
            data.text ||
            data.msg ||
            "I couldn't generate a response.";

        history.push({
            role: "Assistant",
            text: reply
        });

        if (history.length > 10)
            history.shift();

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: reply
            },
            {
                quoted: msg
            }
        );

    } catch (err) {
        console.log("CHATBOT ERROR:", err.response?.data || err.message);

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: "❌ Failed to contact the AI server."
            },
            {
                quoted: msg
            }
        );
    }
}

module.exports = {
    handleChatBot
};