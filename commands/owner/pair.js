const fs = require('fs');
const path = require('path');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { mentionTag } = require('../../handlers/_shared');

moon({
  name: "pair",
  category: "owner",
  roles: ["True Owner", "CDC"],
  description: "Generate a pairing code and send the session file to YOUR DM",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      // Initiator is the one who ran the command (sender)
      const initiator = sender;

      // Resolve target number from mention, reply, or args
      let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                   m.message?.extendedTextMessage?.contextInfo?.participant ||
                   args[0];

      if (!target) {
        return reply("❌ Usage: `.pair <number>` or tag/reply to a user.");
      }

      // Extract raw number
      const phoneNumber = target.replace(/[^0-9]/g, "");
      if (phoneNumber.length < 8) return reply("❌ Invalid phone number format.");
      
      const tempSessionDir = path.join(__dirname, `../../temp_session_${Date.now()}`);
      if (!fs.existsSync(tempSessionDir)) fs.mkdirSync(tempSessionDir, { recursive: true });

      const { state, saveCreds } = await useMultiFileAuthState(tempSessionDir);
      const { version } = await fetchLatestBaileysVersion();

      const tempSock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
      });

      tempSock.ev.on("creds.update", saveCreds);

      await reply(`⏳ Requesting pairing code for *${phoneNumber}*...`);

      // Wait for socket
      await new Promise(r => setTimeout(r, 3000));

      const code = await tempSock.requestPairingCode(phoneNumber);
      const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

      await sock.sendMessage(jid, {
        text: `✅ *Pairing Code:* \`${formattedCode}\`\n\n> Target: ${mentionTag(phoneNumber + "@s.whatsapp.net")}\n> Please enter this code on your phone as fast as possible!\n> Once paired, the session will be sent to *YOUR* (${mentionTag(initiator)}) DM.`,
        mentions: [phoneNumber + "@s.whatsapp.net", initiator]
      }, { quoted: m });

      let paired = false;
      tempSock.ev.on("connection.update", async (update) => {
        const { connection } = update;
        if (connection === "open" && !paired) {
          paired = true;
          
          const credsFile = path.join(tempSessionDir, "creds.json");
          
          if (fs.existsSync(credsFile)) {
            // SUCCESS REPLY
            await reply(`✅ User *${phoneNumber}* has been successfully paired!`);

            // SEND SESSION TO INITIATOR'S DM
            await sock.sendMessage(initiator, {
              document: fs.readFileSync(credsFile),
              fileName: `session_${phoneNumber}.json`,
              mimetype: "application/json",
              caption: `✅ *Pairing Successful!* \n\nTarget: ${phoneNumber}\nHere is the session file for the paired account.\nKeep this safe!`
            });
          }

          // Cleanup
          try {
            tempSock.logout();
            setTimeout(() => fs.rmSync(tempSessionDir, { recursive: true, force: true }), 5000);
          } catch {}
        }
      });

      // Timeout 2 mins
      setTimeout(() => {
        if (!paired) {
          try {
            tempSock.end();
            fs.rmSync(tempSessionDir, { recursive: true, force: true });
          } catch {}
        }
      }, 120000);

    } catch (err) {
      console.error("PAIR CMD ERROR:", err);
      return reply(`❌ Error: ${err.message}`);
    }
  }
});
