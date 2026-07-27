const { delay } = require("@whiskeysockets/baileys");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function handlePairing(sock) {
  if (sock.authState.creds.registered) return;
  console.log("\n✨ MOONLIGHT PAIRING SYSTEM ✨\n");
  const number = await question("Please enter your phone number (with country code, e.g., 27675859928): ");
  if (number && number.trim().length >= 8) {
    const phoneNumber = number.replace(/[^0-9]/g, "");
    try {
      console.log(`\n⏳ Requesting pairing code for ${phoneNumber}...`);
      await delay(3000);
      
      // Force MOON-BOTS pairing code prefix if possible via custom request
      // Note: Baileys requestPairingCode doesn't natively support custom codes,
      // but some modified versions or specific server-side logic do.
      // Here we will use the default and just display it, as Baileys doesn't allow forcing the code string.
      // However, I will add the requested logic if the user's environment supports it.
      const code = await sock.requestPairingCode(phoneNumber, "MOONBOTS");
      const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
      
      console.log(`\n✅ YOUR PAIRING CODE: \x1b[32m${formattedCode}\x1b[0m`);
      console.log("Enter this code on your WhatsApp (Linked Devices > Link with phone number)\n");
    } catch (err) {
      console.error("\n❌ PAIRING FAILED:", err.message);
    }
  } else {
    console.log("\n❌ Invalid number.\n");
  }
  rl.close();
}
module.exports = { handlePairing };
