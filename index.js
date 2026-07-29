const {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
// ── Core modules ──────────────────────────────────────────────────────────────
const { findOrCreateWhatsApp } = require("./database/users");
const { connectDB } = require("./database/index");
const { loadCommands, runCommand } = require("./handler/cmds");
const afkEvent = require("./handler/afk");
const handleOwnerTag = require("./handler/OwnersMeme");
const { startNewsScheduler } = require("./handlers/News");
const handleGroupEvents = require("./handler/GroupSettings");
const handleGroupAdmins = require("./handler/GroupAdmins");
const { handlePairing } = require("./handlers/pair");
const { handleSuspension } = require("./handler/Stetus");
const { spawnCard } = require("./handler/CardsSystem");
const { updateEventStats } = require("./commands/gambling/_shared");
const { startCommunityManager } = require("./handlers/Community");
// ── NEW: Force-add protection ─────────────────────────────────────────────────
const { handleForceAdd } = require("./handlers/Bot");
const Bot = require("./models/athers/Bot");
const Group = require("./models/athers/Group");
const User = require("./models/User");
const config = require("./config");

const { handleChatBot } = require("./handler/ChatBot");
// ── Helpers ───────────────────────────────────────────────────────────────────
function getMessageText(m) {
  return (
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    m.message?.buttonsResponseMessage?.selectedButtonId ||
    m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ""
  );
}
// ── Heartbeat (non-blocking) ──────────────────────────────────────────────────
async function updateHeartbeat() {
  try {
    const botName = (config.BOT_NAME || "Rem").toLowerCase();
    Bot.findOneAndUpdate(
      { name: botName },
      { lastSeen: new Date() },
      { upsert: true }
    ).catch(() => {});
  } catch {}
}
// ── Per-user message XP tracking ─────────────────────────────────────────────
function trackUserMessage(senderJid) {
  User.findOneAndUpdate(
    { whatsappNumber: senderJid },
    { $inc: { messageCount: 1 } },
    { upsert: false }
  ).catch(() => {});
}
// ── Bot start ─────────────────────────────────────────────────────────────────
async function startBot() {
  await connectDB();
  await loadCommands();
  const sessionPath = path.join(process.cwd(), "sessions");
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: Browsers.ubuntu("Chrome"),
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 3,
    connectTimeoutMs: 20000,
    keepAliveIntervalMs: 15000,
    emitOwnEvents: false,
    syncFullHistory: false,
    fireInitQueries: false,
    generateHighQualityLinkPreview: false,
  });
  if (!sock.authState.creds.registered) {
    await handlePairing(sock);
  }
  sock.ev.on("creds.update", saveCreds);
  // Heartbeat every 30s (non-blocking)
  setInterval(updateHeartbeat, 30000);
  updateHeartbeat();
  // ── Connection handler ────────────────────────────────────────────────────
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
        : true;
      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        startBot();
      } else {
        console.log("❌ Logged out. Shutting down bot automatically...");
        process.exit(0);
      }
    } else if (connection === "open") {
      console.log("✅ Connected!");
      startNewsScheduler(sock);
      startCommunityManager(sock);
      
      // Start auto-update handler
      const { startAutoUpdate } = require("./handlers/Bot");
      startAutoUpdate(sock);
    }
  });
  // ── Group participant events ──────────────────────────────────────────────
  // handleForceAdd MUST run first so the bot can leave before any other logic.
  sock.ev.on("group-participants.update", async (update) => {
    handleForceAdd(sock, update).catch(() => {});
    handleGroupEvents(sock, update).catch(() => {});
  });
  // ── Main message handler ──────────────────────────────────────────────────
  sock.ev.on("messages.upsert", async (m) => {
      console.log("MESSAGES.UPSERT FIRED");
    console.log("[DEBUG] Message received:", JSON.stringify(m, null, 2));
    if (m.type !== "notify") return;
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const jid      = msg.key.remoteJid;
    const isGroup  = jid.endsWith("@g.us");
    const sender   = isGroup ? msg.key.participant : jid;
    const pushName = msg.pushName || "Unknown";
    const body     = getMessageText(msg);
      await handleChatBot(sock, msg, body, config);
    const isCmd    = body.startsWith(config.PREFIX);

    // ── DM Protection ────────────────────────────────────────────────
    if (!isGroup && !msg.key.fromMe) {
      const { isOwner } = require("./database/users");
      const owner = await isOwner(sender);
      if (!owner) {
        console.log(`[DM PROTECTION] Suspending user ${sender} for DMing the bot.`);
        const { findOrCreateWhatsApp } = require("./database/users");
        const user = await findOrCreateWhatsApp(sender);
        if (user && !user.suspended) {
          user.suspended = true;
          user.suspendReason = "Messaging the bot in DMs";
          await user.save();
        }
        return; // Silent block
      }
    }

    // ── Group activity tracking (non-blocking) ────────────────────────
    if (isGroup) {
      Group.findOneAndUpdate(
        { groupId: jid },
        { $inc: { totalMessages: isCmd ? 0 : 1, botMessages: isCmd ? 1 : 0 } },
        { upsert: true }
      ).catch(() => {});
      updateEventStats(sender, "message", 1).catch(() => {});
      if (!isCmd) {
        trackUserMessage(sender);
      }
    }
    // ── Suspension check (fast path) ─────────────────────────────────
    const cmdName = isCmd
      ? body.slice(config.PREFIX.length).trim().split(/ +/)[0]?.toLowerCase() || ""
      : "";
    console.log("[DEBUG] Checking suspension for:", sender, "cmd:", cmdName, "isCmd:", isCmd);
     const suspended = await handleSuspension(sock, jid, sender, msg, cmdName, isCmd);
     if (suspended?.blocked) {
      console.log("[DEBUG] User is suspended, blocking command.");
      return;
    }
    // ── Group admin handler ───────────────────────────────────────────
    if (isGroup) {
      const adminHandled = await handleGroupAdmins(sock, msg);
      if (adminHandled) return;
    }
    // ── Non-blocking side-handlers ────────────────────────────────────
    handleOwnerTag(sock, msg, body).catch(() => {});
    spawnCard(sock, jid).catch(() => {});
    // ── User init + AFK (only when needed) ───────────────────────────
    if (isCmd || body.includes("@")) {
      const [user] = await Promise.all([
        findOrCreateWhatsApp(sender, pushName).catch(() => null),
      ]);
      if (user) {
        afkEvent(sock, msg, sender, jid, user).catch(() => {});
      }
    }
    // ── Command dispatch ──────────────────────────────────────────────
    if (isCmd) {
      console.log("[DEBUG] Dispatching command:", cmdName);
      runCommand(sock, jid, sender, msg).then(() => console.log("[DEBUG] runCommand finished.")).catch((e) => {
        console.error("CMD DISPATCH ERROR:", e);
      });
    }
  });
}
startBot();
