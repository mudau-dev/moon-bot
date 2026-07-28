--- a/index.js
+++ b/index.js
@@
 const { handleChatBot } = require("./handler/ChatBot");
+const { initErrorHandler } = require("./handlers/errorLogger");
+const { logMessage } = require("./handlers/messageLogger");
+const { downloadMedia } = require("./handlers/media");
@@
   const sock = makeWASocket({
@@
   });
+  // Initialize error handler with socket so it can notify owner on crashes
+  try { initErrorHandler(sock); } catch (e) { console.error('Failed to init error handler:', e.message); }
@@
   sock.ev.on("messages.upsert", async (m) => {
       console.log("MESSAGES.UPSERT FIRED");
     console.log("[DEBUG] Message received:", JSON.stringify(m, null, 2));
     if (m.type !== "notify") return;
     const msg = m.messages[0];
     if (!msg.message || msg.key.fromMe) return;
+    // Non-blocking message log for auditing
+    try { logMessage(m); } catch (e) {}
     const jid      = msg.key.remoteJid;
*** End Patch
