const System = require('../models/System');

function muteKey(groupJid) {
  return `mutedUsers:${groupJid}`;
}

function normalizeUser(userJid) {
  if (!userJid) return null;
  if (String(userJid).includes('@')) return String(userJid);
  const digits = String(userJid).replace(/[^0-9]/g, '');
  return digits ? `${digits}@s.whatsapp.net` : null;
}

async function getMutedUsers(groupJid) {
  const doc = await System.findOne({ key: muteKey(groupJid) });
  const list = Array.isArray(doc?.value) ? doc.value : [];
  return list.map(normalizeUser).filter(Boolean);
}

async function isMuted(groupJid, userJid) {
  const normalized = normalizeUser(userJid);
  if (!normalized) return false;
  const list = await getMutedUsers(groupJid);
  return list.includes(normalized);
}

async function muteUser(groupJid, userJid) {
  const normalized = normalizeUser(userJid);
  if (!normalized) return [];
  const list = await getMutedUsers(groupJid);
  if (!list.includes(normalized)) list.push(normalized);
  await System.findOneAndUpdate(
    { key: muteKey(groupJid) },
    { key: muteKey(groupJid), value: list, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return list;
}

async function unmuteUser(groupJid, userJid) {
  const normalized = normalizeUser(userJid);
  if (!normalized) return [];
  const list = (await getMutedUsers(groupJid)).filter(j => j !== normalized);
  await System.findOneAndUpdate(
    { key: muteKey(groupJid) },
    { key: muteKey(groupJid), value: list, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return list;
}

module.exports = { normalizeUser, getMutedUsers, isMuted, muteUser, unmuteUser };
