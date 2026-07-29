// handler/cmds.js  (updated — added category lock enforcement)
// ─────────────────────────────────────────────────────────────────────────────
// Changes vs original:
//   • Imports CategoryLock model
//   • In executeWrapped(), after role check, checks if the command's category
//     is locked in the DB. Bypass roles (True Owner, Owner, Mod, CDC) skip it.
// ─────────────────────────────────────────────────────────────────────────────

const path    = require("path");
const fs      = require("fs");
const config  = require("../config");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
// ── Helper: Get text from message object ─────────────────────────────────────
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
const { isBotActive }          = require("../handlers/_shared");
const { findOrCreateWhatsApp } = require("../database/users");
const { checkUserRole }        = require("./roleChecker");
const handleAFK                = require("./afk");

const Group    = require("../models/athers/Group");
const Cooldown = require("../models/athers/Cooldowns");

// ── NEW: Category lock model ──────────────────────────────────────────────────
const CategoryLock = require("../models/athers/CategoryLock");

// Roles that bypass category locks
const LOCK_BYPASS_ROLES = new Set(["True Owner", "Owner", "Mod", "CDC"]);

const { commands } = require("./moon");

// ── Reply helpers ─────────────────────────────────────────────────────────────
function createReply(sock, jid, m) {
  return (text, extra = {}) =>
    sock.sendMessage(jid, { text, ...extra }, { quoted: m });
}
function createReplyWithImage(sock, jid, m) {
  return (imageUrl, caption, extra = {}) =>
    sock.sendMessage(jid, { image: { url: imageUrl }, caption, ...extra }, { quoted: m });
}

// ── Gambling helper ───────────────────────────────────────────────────────────
function isGamblingCommand(cmd) {
  return String(cmd.category || "").toLowerCase() === "gambling";
}

// ── Command loader ────────────────────────────────────────────────────────────
async function loadCommands() {
  const commandsDir = path.join(process.cwd(), "commands");
  const readCommands = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        readCommands(fullPath);
      } else if (file.endsWith(".js")) {
        try {
          delete require.cache[require.resolve(fullPath)];
          require(fullPath);
        } catch (e) {
          console.error(`[LOADER] Failed to load ${file}:`, e.message);
        }
      }
    }
  };
  global.moon = require("./moon").moon;
  readCommands(commandsDir);
  console.log(`[LOADER] Loaded ${commands.size} commands/aliases.`);
  console.log("[LOADER] Command names:", Array.from(commands.keys()).slice(0, 10).join(", "));
}

// ── Command runner ────────────────────────────────────────────────────────────
async function runCommand(sock, jid, sender, m) {
  console.log("[DEBUG] runCommand called for:", jid);
  try {
    // if (!jid.endsWith("@g.us")) return;
    const body = getMessageText(m);
    const text = body.trim();
    if (!text || !text.startsWith(config.PREFIX)) return;
    const args    = text.slice(config.PREFIX.length).trim().split(/ +/).filter(Boolean);
    const cmdName = args.shift()?.toLowerCase();
    if (!cmdName) return;
    const cmd = commands.get(cmdName);
    console.log("[DEBUG] Found command:", cmdName, "->", !!cmd);
    if (!cmd) return;
    const pushName = m.pushName || m.notifyName || sender.split("@")[0];
    const reply    = createReply(sock, jid, m);
    const replyWithImage = createReplyWithImage(sock, jid, m);
    // ── Run bot-active check and user init in parallel ────────────────────
    const [active, user] = await Promise.all([
      isBotActive(sock, jid, sender),
      findOrCreateWhatsApp(sender, pushName).catch(() => null)
    ]);
    if (!active) return;
    // ── AFK (non-blocking) ────────────────────────────────────────────────
    handleAFK(sock, jid, sender, m).catch(() => {});
    // ── Context ───────────────────────────────────────────────────────────
    const context = {
      reply,
      replyWithImage,
      commands,
      findOrCreateWhatsApp,
      user,
      pushName,
      prefix: config.PREFIX,
      body: text,
      downloadMediaMessage
    };
    return await executeWrapped(cmd, sock, jid, sender, args, m, context);
  } catch (e) {
    console.error("DISPATCH ERROR", e);
  }
}

// ── Execute with role / category-lock / cooldown checks ──────────────────────
async function executeWrapped(cmd, sock, jid, sender, args, m, context) {
  try {
    const now = Date.now();

    // ── 1. Role check ─────────────────────────────────────────────────────
    if (Array.isArray(cmd.roles) && cmd.roles.length) {
      const r = await checkUserRole(sender, cmd.roles);
      if (!r.allowed) return context.reply(r.message || "❌ No permission");
    }

    // ── 2. Category lock check & Registration lock ───────────────────────
    if (cmd.category) {
      const catKey = cmd.category.toLowerCase();

      // Bypass for staff
      const userRole = context.user?.role || 'User';
      const isBypass =
        LOCK_BYPASS_ROLES.has(userRole) ||
        context.user?.isTrueOwner === true ||
        context.user?.isCDC === true;

      if (!isBypass) {
        // Registration Lock
        const restrictedCategories = ["economy", "gambling", "pokémon", "pokemons", "lagacy", "legacy"];
        if (restrictedCategories.includes(catKey)) {
          const isRegistered = context.user && context.user.moonId && !context.user.moonId.startsWith("moon_");
          if (!isRegistered) {
            return context.reply(
              `🔒 *Access Denied*\n` +
              `The *${cmd.category}* commands are for registered users only.\n\n` +
              `👉 Please register at: ${config.WEB}`
            );
          }
        }

        // Database Category Lock
        if (catKey !== 'owner') {
          const lockDoc = await CategoryLock.findOne({ category: catKey }).lean();
          if (lockDoc?.locked) {
            return context.reply(
              `🔒 *Category Locked*\n` +
              `The *${cmd.category}* category is currently unavailable.\n\n` +
              `📝 *Reason:* ${lockDoc.reason || 'No reason provided.'}`
            );
          }
        }
      }
    }

    // ── 3. Gambling group check ───────────────────────────────────────────
    if (isGamblingCommand(cmd)) {
      const group = await Group.findOne({ groupId: jid }).lean();
      if (!group || group.gamblingEnabled !== true) {
        return context.reply("❌️ you cant gamble here baka. use `.casinos` to get the gambling casinos.");
      }
    }

    // ── 4. Cooldown (gambling only) ───────────────────────────────────────
    if (isGamblingCommand(cmd)) {
      let cooldownData = await Cooldown.findOne({ userId: sender });
      if (!cooldownData) cooldownData = new Cooldown({ userId: sender, commands: new Map() });
      let c = cooldownData.commands.get(cmd.name) || { count: 0, cooldownUntil: 0 };
      if (c.cooldownUntil > now) {
        const left = Math.ceil((c.cooldownUntil - now) / 1000);
        return context.reply(`⏳ Wait ${left}s before using this command again`);
      }
      c.count++;
      if (c.count >= 10) {
        const cd = Math.floor(Math.random() * 91) + 30;
        c.cooldownUntil = now + cd * 1000;
        c.count = 0;
        cooldownData.commands.set(cmd.name, c);
        await cooldownData.save();
        return context.reply(`⏳ Cooldown: ${cd}s`);
      }
      cooldownData.commands.set(cmd.name, c);
      cooldownData.save().catch(() => {});
    }

    return await cmd.execute(sock, jid, sender, args, m, context);
  } catch (e) {
    console.error(`[CMD ERROR] ${cmd.name}:`, e);
    return context.reply(`❌ An error occurred: ${e.message}`);
  }
}

module.exports = { commands, runCommand, loadCommands };
