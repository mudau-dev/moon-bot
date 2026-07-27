const Guild = require("../../models/athers/Guild");
const { generateGuildProfile } = require("../../utils/guildGen");

// ── Helpers ──────────────────────────────────────────────────────────────────

function userNumber(jid) {
  return (jid || "").split("@")[0];
}

async function getUserGuild(userId) {
  const id = userNumber(userId);
  return await Guild.findOne({ members: id });
}

async function getGuilds() {
  return await Guild.find();
}

/**
 * EXACT NAME RESOLUTION LOGIC FROM profile.js
 */
async function getName(target) {
  if (!target) return "Unknown";
  // target is expected to be full JID like '12345@s.whatsapp.net'
  const jid = target.includes("@") ? target : `${target}@s.whatsapp.net`;
  const id = jid.split('@')[0];
  
  try {
    const User = require("../../models/User");

async function getName(sender) {
    if (!sender) return "Unknown";

    const jid = sender.includes("@") ? sender : `${sender}@s.whatsapp.net`;

    const user = await User.findOne({
        whatsappNumber: jid
    });

    if (!user) {
        return jid.replace(/@s\.whatsapp\.net|@lid/g, "");
    }

    return user.username?.trim() ||
           jid.replace(/@s\.whatsapp\.net|@lid/g, "");
}
    
    const user = userDoc.toObject();
    return user.username || id;
  } catch (err) {
    console.error("getName error:", err);
    return id;
  }
}

// ── Command ───────────────────────────────────────────────────────────────────

moon({
  name: "guild",
  category: "GUILDS",
  aliases: ["g"],
  description: "Comprehensive Guild Management System",
  subcommands: ["create", "list", "join", "members", "setimage", "desc", "remove", "leave", "delete"],
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const senderId = userNumber(sender);
      const sub = args[0]?.toLowerCase();

      // ── 1. GUILD PROFILE ──────────────────────────────────────────────────
      if (!sub) {
        const guild = await getUserGuild(senderId);
        if (!guild) return reply("❌ You are not in a guild. Use `.guild list` to see available guilds.");

        // Resolve owner name using full JID
        const ownerJid = `${guild.ownerId}@s.whatsapp.net`;
        const ownerName = await getName(ownerJid);
        
        // Fetch owner's profile pic (EXACT profile.js LOGIC)
        let profileImage = null;
        try {
          profileImage = await sock.profilePictureUrl(ownerJid, 'image');
        } catch {}

        const userProfile = { 
          name: ownerName, 
          profilePic: profileImage || "https://i.ibb.co/L50k8fW/haven-festival.jpg" 
        };

        const image = await generateGuildProfile(guild, userProfile);
        
        const text = [
          "┏━━━━━━━━━━━━━━┓",
          `┃ 🏰 *GUILD PROFILE*`,
          `┃ 🛡️ *Name:* ${guild.name}`,
          `┃ 👥 *Members:* ${guild.members.length}`,
          `┃ 👑 *Leader:* ${ownerName}`,
          "┗━━━━━━━━━━━━━━┛",
          `> *DESCRIPTION:*`,
          guild.description || "No description set."
        ].join("\n");

        return await sock.sendMessage(jid, { 
          image: image.buffer, 
          caption: text 
        }, { quoted: m });
      }

      // ── 2. CREATE ──────────────────────────────────────────────────────────
      if (sub === "create") {
        const name = args.slice(1).join(" ");
        if (!name) return reply("❌ Usage: .guild create <name>");
        const existing = await Guild.findOne({ name });
        if (existing) return reply("❌ A guild with this name already exists.");
        const userInGuild = await getUserGuild(senderId);
        if (userInGuild) return reply("❌ You are already in a guild.");
        const newGuild = new Guild({
          name,
          ownerId: senderId,
          members: [senderId],
          description: "A new legendary guild."
        });
        await newGuild.save();
        return reply(`✅ Guild *${name}* created successfully!`);
      }

      // ── 3. LIST ────────────────────────────────────────────────────────────
      if (sub === "list") {
        const guilds = await getGuilds();
        if (guilds.length === 0) return reply("❌ No guilds found.");
        let text = "🏆 *REALMS GUILDS LIST*\n";
        for (let i = 0; i < guilds.length; i++) {
          const g = guilds[i];
          const ownerName = await getName(`${g.ownerId}@s.whatsapp.net`);
          text += `\n${i + 1}. *${g.name}*\n   👤 Leader: ${ownerName}\n   👥 Members: ${g.members.length}\n`;
        }
        return reply(text);
      }

      // ── 4. JOIN ────────────────────────────────────────────────────────────
      if (sub === "join") {
        const index = Number(args[1]);
        if (!index || isNaN(index)) return reply("❌ Usage: .guild join <index>");
        const guilds = await getGuilds();
        const guild = guilds[index - 1];
        if (!guild) return reply("❌ Guild not found.");
        const existing = await getUserGuild(senderId);
        if (existing) return reply("❌ You are already in a guild.");
        if (guild.banned.includes(senderId)) return reply("❌ You are banned from this guild.");
        guild.members.push(senderId);
        await guild.save();
        return reply(`✅ You have joined *${guild.name}*!`);
      }

      // ── 5. MEMBERS ─────────────────────────────────────────────────────────
      if (sub === "members") {
        const guild = await getUserGuild(senderId);
        if (!guild) return reply("❌ You are not in a guild.");
        let text = `👥 *${guild.name.toUpperCase()} — MEMBERS*\n\n`;
        const mentions = [];
        for (let i = 0; i < guild.members.length; i++) {
          const mid = guild.members[i];
          const mName = await getName(`${mid}@s.whatsapp.net`);
          const role = mid === guild.ownerId ? "👑 Leader" : "⚔️ Member";
          text += `${i + 1}. ${mName} (${role})\n`;
          mentions.push(`${mid}@s.whatsapp.net`);
        }
        return await sock.sendMessage(jid, { text, mentions }, { quoted: m });
      }

      // ── 6. SETIMAGE ────────────────────────────────────────────────────────
      if (sub === "setimage") {
        const guild = await Guild.findOne({ ownerId: senderId });
        if (!guild) return reply("❌ Only the guild leader can set the background image.");
        const url = args[1];
        if (!url || !url.startsWith("http")) return reply("❌ Usage: .guild setimage <url>");
        guild.icon = url;
        await guild.save();
        return reply("✅ Guild background image updated!");
      }

      // ── 7. DESC ────────────────────────────────────────────────────────────
      if (sub === "desc") {
        const guild = await Guild.findOne({ ownerId: senderId });
        if (!guild) return reply("❌ Only the guild leader can change the description.");
        const description = args.slice(1).join(" ");
        if (!description) return reply("❌ Usage: .guild desc <description>");
        guild.description = description;
        await guild.save();
        return reply("✅ Guild description updated.");
      }

      // ── 8. REMOVE ──────────────────────────────────────────────────────────
      if (sub === "remove") {
        const guild = await Guild.findOne({ ownerId: senderId });
        if (!guild) return reply("❌ Only the owner can remove members.");
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = mentioned ? userNumber(mentioned) : args[1];
        if (!target) return reply("❌ Mention a user to remove.");
        if (target === senderId) return reply("❌ You cannot remove yourself.");
        guild.members = guild.members.filter(id => id !== target);
        if (!guild.banned.includes(target)) guild.banned.push(target);
        await guild.save();
        const tName = await getName(`${target}@s.whatsapp.net`);
        return reply(`🚫 *${tName}* has been removed and banned from the guild.`);
      }

      // ── 9. LEAVE ───────────────────────────────────────────────────────────
      if (sub === "leave") {
        const guild = await getUserGuild(senderId);
        if (!guild) return reply("❌ You are not in a guild.");
        if (guild.ownerId === senderId) return reply("❌ Owners cannot leave. Use .guild delete instead.");
        guild.members = guild.members.filter(id => id !== senderId);
        await guild.save();
        return reply(`✅ You left *${guild.name}*.`);
      }

      // ── 10. DELETE ─────────────────────────────────────────────────────────
      if (sub === "delete") {
        const guild = await Guild.findOne({ ownerId: senderId });
        if (!guild) return reply("❌ Only the owner can delete the guild.");
        await Guild.deleteOne({ _id: guild._id });
        return reply(`🗑️ Guild *${guild.name}* has been deleted.`);
      }

      return reply("❌ Unknown guild command.");
    } catch (err) {
      console.error("GUILD ERROR:", err);
      return reply("❌ An error occurred in the guild system.");
    }
  }
});
