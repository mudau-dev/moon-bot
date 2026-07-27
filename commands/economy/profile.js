const User = require('../../models/User');
const Guild = require('../../models/athers/Guild');
const moment = require('moment-timezone');
const { generateProfileImage } = require('../../utils/profileGenerator');
const { findOrCreateWhatsApp } = require('../../database/users');

function calcLevelXP(messageCount) {
  const count = Number(messageCount) || 0;
  const level = Math.floor(count / 50) + 1;
  const xp = count % 50;
  const xpTarget = 50;
  return { level, xp, xpTarget };
}

async function getUserGuild(userId) {
  try {
    return await Guild.findOne({ members: userId });
  } catch {
    return null;
  }
}

moon({
  name: "p",
  category: "economy",
  aliases: ["profile", "pf"],
  description: "Show user profile card",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      await sock.sendMessage(jid, { react: { text: "👤", key: m.key } });
      const contextInfo = m?.message?.extendedTextMessage?.contextInfo || {};
      const target = contextInfo?.mentionedJid?.[0] || contextInfo?.participant || sender;
      const id = target?.split('@')[0];
      
      const userDoc = await findOrCreateWhatsApp(target);
      if (!userDoc) return reply("❌ User not found.");
      const user = userDoc.toObject ? userDoc.toObject() : userDoc;

      const wallet = Number(user.balance ?? 0);
      const bank   = Number(user.bank   ?? 0);
      
      const roleMap = {
        "True Owner": "Owner",
        "Owner":      "Co-owner",
        "Mod":        "MMod",
        "CDC":        "Manager",
        "Tester":     "Tester",
        "User":       "Citizen"
      };
      const displayRole = roleMap[user.role] || "Moon Citizen";
      
      const guild = await getUserGuild(id);
      const guildName = guild ? guild.name : "N/A";
      const rank = await User.countDocuments({ balance: { $gt: user.balance } }) + 1;
      const { level, xp, xpTarget } = calcLevelXP(user.messageCount);
      
      let profileImage = null;
      try {
        profileImage = await sock.profilePictureUrl(target, 'image');
      } catch {}

      const profileData = {
        username: user.username || id,
        bank,
        wallet,
        bio: user.bio && user.bio !== "." ? user.bio : "N/A",
        rank,
        level,
        xp,
        xpTarget,
        role: displayRole,
        profileImage,
        backgroundImage: user.backgroundImage || null
      };

      const buffer = await generateProfileImage(profileData);
      
      const caption = `╭━━━[ 👤 *ℙℝ𝕆𝔽𝕀𝕃𝔼* ]━━━
┃ *Name:* ${user.username || id}
┃ *Role:* *${displayRole}*
┃ *Level:* ${level} (${xp}/${xpTarget} XP)
┃ *Wallet:* ${wallet.toLocaleString()}
┃ *Bank:* ${bank.toLocaleString()}
┃ *Guild:* ${guildName}
┣━━━[ *BIO* ]━━━━━
┃ ${profileData.bio}
┣━━━[ *INFO* ]━━━━
┃ *Id:* ${id}
┃ *Joined:* ${user.createdAt ? moment(user.createdAt).format('DD/MM/YYYY') : "Unknown"}
╰━━━━━━━━━━━━━━━┈`;

      await sock.sendMessage(jid, { image: buffer, caption, mentions: [target] }, { quoted: m });
    } catch (err) {
      console.error("PROFILE ERROR:", err);
      return reply("❌ Error loading profile.");
    }
  }
});