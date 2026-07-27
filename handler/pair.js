const readline = require("readline");

/**
 * Handles the pairing code generation process.
 * Ensures the readline interface is managed and the pairing code is requested correctly.
 */
async function handlePairing(sock) {
  if (sock.authState.creds.registered) return;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (text) => new Promise((resolve) => rl.question(text, resolve));

  console.log("\n" + "=".repeat(40));
  console.log("⚠️  NO SESSION FOUND. ENTERING PAIRING MODE.");
  console.log("=".repeat(40) + "\n");

  const phoneNumber = await question("📞 Enter your bot's phone number (with country code, e.g., 2348123456789): ");

  if (phoneNumber && phoneNumber.trim().length > 7) {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
    
    try {
      console.log(`⏳ Requesting pairing code for ${cleanNumber}...`);
      
      // Delay slightly to ensure socket is ready
      await new Promise(r => setTimeout(r, 3000));
      
      const code = await sock.requestPairingCode(cleanNumber);
      
      console.log("\n" + "🔗".repeat(20));
      console.log(`YOUR PAIRING CODE IS: ${code}`);
      console.log("🔗".repeat(20) + "\n");
      
      console.log("👉 Open WhatsApp > Linked Devices > Link with Phone Number.");
      console.log("ℹ️  Keep this console open until the bot connects.\n");
    } catch (err) {
      console.error("\n❌ PAIRING ERROR:", err.message);
      console.log("Please restart the bot and try again.\n");
    }
  } else {
    console.log("\n❌ Invalid phone number. Restarting bot...\n");
    process.exit(1);
  }

  rl.close();
}

module.exports = { handlePairing };
