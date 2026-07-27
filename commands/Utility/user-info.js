moon({
  name: 'user-info',
  category: 'Utility',
  description: 'Show WhatsApp user profile info (no DB)',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const contextInfo = m.message?.extendedTextMessage?.contextInfo;

      let targetJid;

      // 1. Reply
      if (contextInfo?.participant) {
        targetJid = contextInfo.participant;
      }

      // 2. Mention
      if (!targetJid && contextInfo?.mentionedJid?.length) {
        targetJid = contextInfo.mentionedJid[0];
      }

      // 3. Self
      if (!targetJid) {
        targetJid = sender;
      }

      // Get profile name (WhatsApp contact name)
      let name;
      try {
        const contact = await sock.getName(targetJid);
        name = contact || 'Unknown';
      } catch {
        name = 'Unknown';
      }

      // Get profile picture
      let pfp;
      try {
        pfp = await sock.profilePictureUrl(targetJid, 'image');
      } catch {
        pfp = null;
      }

      const text =
`👤 *User Profile*

🪪 *Name:* ${name}
🆔 *ID:* ${targetJid}`;

      // Send image if available, otherwise text only
      if (pfp) {
        return sock.sendMessage(jid, {
          image: { url: pfp },
          caption: text
        });
      } else {
        return reply(text);
      }

    } catch (err) {
      console.error('Info command error:', err);
      return reply('❌ Failed to fetch user info.');
    }
  }
});