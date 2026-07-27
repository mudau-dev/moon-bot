const fs = require('fs');
const path = require('path');

// ---------------- PATH ----------------
const filePath = path.join(process.cwd(), "database", "group.json");

// ---------------- CACHE ----------------
let groupCache = null;
let lastLoadTime = 0;
const CACHE_TTL = 30000;

// ---------------- ENSURE FILE ----------------
function ensureFile() {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
  }
}

// ---------------- LOAD ----------------
function loadData() {
  const now = Date.now();
  if (groupCache && (now - lastLoadTime < CACHE_TTL)) return groupCache;

  ensureFile();

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = raw.trim() ? JSON.parse(raw) : {};
    groupCache = data;
    lastLoadTime = now;
    return data;
  } catch (err) {
    console.error('Load error:', err);
    return groupCache || {};
  }
}

// ---------------- SAVE ----------------
function saveData(data) {
  ensureFile();
  groupCache = data;
  lastLoadTime = Date.now();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------------- DEFAULT ----------------
function defaultGroup() {
  return {
    welcomeEnabled: false,
    welcomeMessage: "👋 Welcome @user to *@gname* you are the *@count member* .use \`.menu\` to start the fun",

    // ✅ GOODBYE FIXED HERE (THIS WAS YOUR ISSUE)
    leaveEnabled: false,
    leaveMessage: "👋 @user left our group what a shame. @count left",

    antilink: {
      enabled: true,
      action: "warn",
      warnLimit: 3,
      warns: {}
    },

    antimention: {
      enabled: true,
      notify: true,
      logs: []
    },

    antibot: {
      enabled: false,
      action: "delete"
    },
    botEnabled: true
  };
}

// ---------------- GET ----------------
function getGroup(groupId) {
  const data = loadData();

  if (!data[groupId]) data[groupId] = defaultGroup();

  const def = defaultGroup();
  const group = data[groupId];

  group.welcomeEnabled = group.welcomeEnabled ?? def.welcomeEnabled;
  group.leaveEnabled = group.leaveEnabled ?? def.leaveEnabled;

  group.welcomeMessage = group.welcomeMessage || def.welcomeMessage;
  group.leaveMessage = group.leaveMessage || def.leaveMessage;

  group.antilink = { ...def.antilink, ...(group.antilink || {}) };

  group.antimention = {
    enabled: group.antimention?.enabled ?? def.antimention.enabled,
    notify: group.antimention?.notify ?? def.antimention.notify,
    logs: group.antimention?.logs ?? def.antimention.logs
  };

  group.antibot = {
    enabled: group.antibot?.enabled ?? def.antibot.enabled,
    action: group.antibot?.action ?? def.antibot.action
  };

  data[groupId] = group;
  saveData(data);
  return group;
}

// ---------------- UPDATE ----------------
function updateGroup(groupId, updates) {
  const data = loadData();

  if (!data[groupId]) data[groupId] = defaultGroup();

  data[groupId] = { ...data[groupId], ...updates };

  saveData(data);
  return data[groupId];
}

// ---------------- ANTILINK ----------------
function updateAntilink(groupId, updates) {
  const data = loadData();
  if (!data[groupId]) data[groupId] = defaultGroup();

  data[groupId].antilink = { ...data[groupId].antilink, ...updates };

  saveData(data);
  return data[groupId].antilink;
}

// ---------------- ANTIMENTION ----------------
function updateAntimention(groupId, updates) {
  const data = loadData();
  if (!data[groupId]) data[groupId] = defaultGroup();

  data[groupId].antimention = { ...data[groupId].antimention, ...updates };

  saveData(data);
  return data[groupId].antimention;
}

// ---------------- ANTIBOT ----------------
function updateAntibot(groupId, updates) {
  const data = loadData();
  if (!data[groupId]) data[groupId] = defaultGroup();

  data[groupId].antibot = { ...data[groupId].antibot, ...updates };

  saveData(data);
  return data[groupId].antibot;
}

// ---------------- GROUP EVENTS ----------------
async function handleGroupEvents(sock, data) {
  try {
    const { id, participants, action } = data;

    const group = getGroup(id);
    const metadata = await sock.groupMetadata(id);

    const { findOrCreateWhatsApp } = require('../../database/users');

    for (const userJid of participants) {
      const isWelcome = action === 'add' && group.welcomeEnabled;
      const isLeave = action === 'remove' && group.leaveEnabled;

      if (!isWelcome && !isLeave) continue;

      let displayName = userJid.split('@')[0];

      try {
        const dbUser = await findOrCreateWhatsApp(userJid);
        if (dbUser?.username && dbUser.username !== 'Unknown') {
          displayName = dbUser.username;
        }
      } catch {}

      let text = isWelcome ? group.welcomeMessage : group.leaveMessage;

      const useProfile = text.includes('@p');

      text = text
        .replace(/@user/g, displayName)
        .replace(/@gname/g, metadata.subject)
        .replace(/@count/g, metadata.participants.length)
        .replace(/@p/g, '')
        .trim();

      let pp = null;

      if (useProfile) {
        try {
          pp = await sock.profilePictureUrl(userJid, 'image');
        } catch {}
      }

      const payload = {
        mentions: [userJid]
      };

      if (pp) {
        await sock.sendMessage(id, {
          image: { url: pp },
          caption: text,
          ...payload
        });
      } else {
        await sock.sendMessage(id, {
          text,
          ...payload
        });
      }
    }
  } catch (err) {
    console.error('Group event error:', err);
  }
}

// ---------------- EXPORT ----------------
module.exports = {
  getGroup,
  updateGroup,
  loadData,
  handleGroupEvents,

  updateAntilink,
  updateAntimention,
  updateAntibot
};