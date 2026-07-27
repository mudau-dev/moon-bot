const config = require('../../config');
const User = require('../../models/User');

moon({
  name: 'addbot',
  aliases: ['dbot'],
  category: 'general',
  description: 'Request bot for your group',

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      const ownerNumbers = config.OWNER_NUMBERS || [];
      const senderNumber = sender.split('@')[0];
      const sub = args[0];

      const readMore = String.fromCharCode(8206).repeat(4001);

      // =========================
      // 📌 MAIN INFO PANEL
      // =========================
      if (!sub) {
        return sock.sendMessage(jid, {
          image: { url: config.MOONLIGHT_IMAGE },
          caption:
`🌙 *𝚳OO𝚴𝐋𝚰𝐆𝚮𝚻 H𝚫V𝚵N BOT REQUEST*
${readMore}

📌 *Requirements*
• 95+ members  
• 60% active members  
• At least 1 admin active  
• Bot must be admin  

📌 *Rules*
• No NSFW content  
• No spam groups  
• Follow WhatsApp rules  
• Do NOT force-add bot  

📌 *How to request a bot*
.addbot <group link> <reason>

📌 *Example*
.addbot https://chat.whatsapp.com/XXXX active group with daily chat

📌 *Commands*
.addbot info
.addbot info <number>`
        }, { quoted: m });
      }

      // =========================
      // 📋 INFO SYSTEM
      // =========================
      if (sub === "info") {

        const users = await User.find({ "botRequests.0": { $exists: true } });

        let allRequests = [];
        let index = 1;

        users.forEach(user => {
          user.botRequests.forEach(req => {
            allRequests.push({
              index: index++,
              userDb: user,
              userId: user.userId,
              groupLink: req.groupLink,
              reason: req.reason
            });
          });
        });

        if (!allRequests.length) {
          return reply("📭 No bot requests found.");
        }

        const num = parseInt(args[1]);

        // =========================
        // SINGLE REQUEST VIEW
        // =========================
        if (num) {
          const req = allRequests.find(r => r.index === num);

          if (!req) {
            return reply("❌ Invalid request number.");
          }

          return sock.sendMessage(jid, {
            text:
`📌 *BOT REQUEST INFO*

👤 User: @${req.userId}
🔗 Group: ${req.groupLink}
📝 Reason: ${req.reason}

🆔 Request #: ${req.index}`,
            mentions: [req.userId]
          }, { quoted: m });
        }

        // =========================
        // FULL LIST
        // =========================
        let text = `📋 *BOT REQUESTS*\n\nTotal: ${allRequests.length}\n`;

        allRequests.slice(0, 30).forEach(r => {
          text += `\n━━━━━━━━━━━━━━━
#${r.index}
👤 @${r.userId}
📝 ${r.reason}
🔗 ${r.groupLink}`;
        });

        return sock.sendMessage(jid, {
          text,
          mentions: allRequests.map(r => r.userId)
        }, { quoted: m });
      }

      // =========================
      // ❌ DELETE REQUEST (OWNER ONLY)
      // =========================
      if (sub === 'del') {

        if (!ownerNumbers.includes(senderNumber)) {
          return reply("⛔ Owner only.");
        }

        const index = parseInt(args[1]);
        const reason = args.slice(2).join(" ").trim();

        if (!index || !reason) {
          return reply("❌ Usage:\n.addbot del <number> <reason>");
        }

        const users = await User.find({ "botRequests.0": { $exists: true } });

        let allRequests = [];
        users.forEach(user => {
          user.botRequests.forEach(req => {
            allRequests.push({
              userDb: user,
              userId: user.userId,
              groupLink: req.groupLink
            });
          });
        });

        const target = allRequests.find(r => r.index === index);

        if (!target) {
          return reply("❌ Request not found.");
        }

        // notify user (safe)
        try {
          await sock.sendMessage(target.userId + "@s.whatsapp.net", {
            text:
`❌ *BOT REQUEST DECLINED*

🔗 ${target.groupLink}

📝 Reason:
${reason}

You may reapply using .addbot`
          });
        } catch {}

        // remove from DB
        target.userDb.botRequests = target.userDb.botRequests.filter(
          r => r.groupLink !== target.groupLink
        );

        await target.userDb.save();

        return reply(`✅ Request #${index} deleted.`);
      }

      // =========================
      // 📤 CREATE REQUEST
      // =========================
      const groupLink = args[0];
      const reason = args.slice(1).join(" ").trim();

      if (!groupLink || !groupLink.includes("chat.whatsapp.com")) {
        return reply("❌ Invalid group link.");
      }

      if (!reason) {
        return reply("❌ Provide a reason.");
      }

      let user = await User.findOne({ userId: senderNumber });

      if (!user) {
        user = new User({
          userId: senderNumber,
          botRequests: []
        });
      }

      const exists = user.botRequests.find(r => r.groupLink === groupLink);

      if (exists) {
        return reply("⚠️ Already requested.");
      }

      user.botRequests.push({
        groupLink,
        reason
      });

      await user.save();

      return reply("✅ Bot request submitted.");

    } catch (err) {
      console.error("ADDBOT ERROR:", err);
      return reply("❌ Command failed.");
    }
  }
});