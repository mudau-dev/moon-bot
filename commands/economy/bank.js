const { money, getUser } = require('./_shared');

moon({
  name: 'bank',
  aliases: ['bk'],
  category: 'economy',
  description: 'Check your bank account.',
  usage: '.bank',

  async execute(sock, jid, sender, args, message, { reply }) {
    try {
      const user = await getUser(sender, message);

      await sock.sendMessage(jid, {
        text: `🏦 *ACCOUNT BALANCE*

💰 *Wallet:* $${money(user.balance)}
🏦 *Bank:* $${money(user.bank)}
💎 *Total:* $${money(user.balance + user.bank)}`,
        contextInfo: {
          externalAdReply: {
            title: message.pushName || "Moonlight User",
            body: "Bank Account",
            thumbnailUrl: "https://havenlight.com/profile", // Replace with your image URL
            sourceUrl: "https://havenlight.com", // Replace with your website
            mediaType: 1,
            renderLargerThumbnail: true,
            showAdAttribution: false
          }
        }
      });

    } catch (err) {
      console.error("Bank error:", err);
      return reply("❌ Could not fetch your bank.");
    }
  }
});