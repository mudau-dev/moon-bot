// =========================
// CORE SAFE SEND WRAPPER
// =========================

function safeSend(sock, jid, m) {
  return async (payload) => {
    try {
      return await sock.sendMessage(jid, payload, { quoted: m });
    } catch (err) {
      console.error('[REPLY ERROR]', err);

      try {
        await sock.sendMessage(jid, {
          text: "⚠️ Message failed to send."
        });
      } catch (e) {
        console.error('[CRITICAL SEND FAIL]', e);
      }

      return null;
    }
  };
}

// =========================
// TEXT REPLY SYSTEM
// =========================
module.exports.messageReply = (sock, jid, m) => {
  const send = safeSend(sock, jid, m);

  return async (text, options = {}) => {
    return await send({
      text,
      mentions: options.mentions || []
    });
  };
};

// =========================
// MENTION REPLY SYSTEM
// =========================
module.exports.replyWithMentions = (sock, jid, m) => {
  const send = safeSend(sock, jid, m);

  return async (text, mentions = []) => {
    return await send({
      text,
      mentions
    });
  };
};

// =========================
// BUTTON SYSTEM
// =========================
module.exports.replyWithButtons = (sock, jid, m) => {
  const send = safeSend(sock, jid, m);

  return async (text, buttons = []) => {
    return await send({
      text,
      footer: 'Moonlight Bot',
      buttons,
      headerType: 1
    });
  };
};

// =========================
// IMAGE SYSTEM
// =========================
module.exports.replyWithImage = (sock, jid, m) => {
  const send = safeSend(sock, jid, m);

  return async (image, caption = '', options = {}) => {
    // Baileys requires image to be { url: '...' } if it's a string URL
    const imagePayload = typeof image === 'string' ? { url: image } : image;
    return await send({
      image: imagePayload,
      caption,
      mentions: options.mentions || []
    });
  };
};

// =========================
// HYBRID RESPONDER (IMPORTANT)
// =========================
// This is your "2 minds in one system"
// old reply() + new safe system BOTH supported
// =========================

module.exports.getResponder = (sock, jid, m, legacyReply) => {

  const safeReply = module.exports.messageReply(sock, jid, m);
  const safeMentions = module.exports.replyWithMentions(sock, jid, m);

  return {
    // unified reply (auto-fallback)
    reply: async (text, options = {}) => {
      if (typeof legacyReply === 'function') {
        return legacyReply(text, options);
      }
      return safeReply(text, options);
    },

    // raw send
    send: async (payload) => {
      try {
        return await sock.sendMessage(jid, payload, { quoted: m });
      } catch (err) {
        console.error('[SEND ERROR]', err);
        return null;
      }
    },

    // mentions-only reply
    mentionReply: async (text, mentions = []) => {
      return safeMentions(text, mentions);
    },

    // force safe system
    safeReply
  };
};

// =========================
// EXPORT SAFE SEND (IMPORTANT)
// =========================
module.exports.safeSend = safeSend;