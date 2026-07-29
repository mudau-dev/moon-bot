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

async function getUserGuild(user) {
  try {
    if (!user) return null;
    return await Guild.findOne({ 
      $or: [
        { members: user.moonId },
        { members: user.userId },
        { members: user.whatsappNumber?.split('@')[0] }
      ]
    });
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
      
      const config = require("../../config");
      const userDoc = await findOrCreateWhatsApp(target);
      const user = userDoc ? (userDoc.toObject ? userDoc.toObject() : userDoc) : null;
      
      const isRegistered = user && user.moonId && !user.moonId.startsWith("moon_");
      
      const wallet = isRegistered ? Number(user.balance ?? 0) : 0;
      const bank   = isRegistered ? Number(user.bank   ?? 0) : 0;
      
      const roleMap = {
        "True Owner": "Owner",
        "Owner":      "Co-owner",
        "Mod":        "MMod",
        "CDC":        "Manager",
        "Tester":     "Tester",
        "User":       "Citizen"
      };
      const displayRole = isRegistered ? (roleMap[user.role] || "Moon Citizen") : "Unregistered";
      
      const guild = isRegistered ? await getUserGuild(user) : null;
      const guildName = guild ? guild.name : "N/A";
      const rank = isRegistered ? (await User.countDocuments({ balance: { $gt: user.balance } }) + 1) : 0;
      const { level, xp, xpTarget } = calcLevelXP(user?.messageCount || 0);
      
      let profileImage = null;
      try {
        profileImage = await sock.profilePictureUrl(target, 'image');
      } catch {}

      const profileData = {
        username: isRegistered ? (user.username || id) : "A/N",
        bank: isRegistered ? bank : 0,
        wallet: isRegistered ? wallet : 0,
        bio: isRegistered ? (user.bio && user.bio !== "." ? user.bio : "A/N") : "A/N",
        rank: isRegistered ? rank : 0,
        level: isRegistered ? level : 0,
        xp: isRegistered ? xp : 0,
        xpTarget: isRegistered ? xpTarget : 100,
        role: displayRole,
        profileImage: profileImage || (isRegistered ? user.avatarUrl : null),
        bannerUrl: isRegistered ? (user.bannerUrl || user.backgroundImage) : null,
        profileFrame: isRegistered ? user.profileFrame : 'classic'
      };

      const buffer = await generateProfileImage(profileData);
      
      let caption = `╭━━━[ 👤 *ℙℝ𝕆𝔽𝕀𝕃𝔼* ]━━━
┃ *Name:* ${profileData.username}
┃ *Role:* *${displayRole}*
┃ *Level:* ${profileData.level}
┃ *Wallet:* ${profileData.wallet.toLocaleString()}
┃ *Bank:* ${profileData.bank.toLocaleString()}
┃ *Guild:* ${guildName}
┣━━━[ *BIO* ]━━━━━
┃ ${profileData.bio}
┣━━━[ *INFO* ]━━━━
┃ *Id:* ${id}
┃ *Joined:* ${user?.createdAt ? moment(user.createdAt).format('DD/MM/YYYY') : "Unknown"}
╰━━━━━━━━━━━━━━━┈\n`;

      if (!isRegistered) {
        caption += `\n🚫 user not registered in Moonlight haven`;
      } else {
        caption += `\n*Profile:* ${config.WEB}/user/${user.moonId}`;
      }

      await sock.sendMessage(jid, { image: buffer, caption, mentions: [target] }, { quoted: m });
    } catch (err) {
      console.error("PROFILE ERROR:", err);
      return reply("❌ Error loading profile.");
    }
  }
});