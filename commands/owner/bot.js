const config = require('../../config');

async function getGroups(sock) {
  const groups = await sock.groupFetchAllParticipating();
  // Filter for regular groups only (exclude communities and announcements)
  return Object.values(groups || {})
    .filter(g => !g.isCommunity && !g.isCommunityAnnounce)
    .sort((a, b) => String(a.subject || '').localeCompare(String(b.subject || '')));
}

function groupType(group) {
  if (group.isCommunity) return "🏘️ Community";
  if (group.isCommunityAnnounce) return "📢 Announce";
  return "👥 Group";
}

moon({
  name: "bot",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Manage bot status, groups, and command list",
  subcommands: ["groups", "gcs", "leave", "gnf", "cmds", "menu"],

  async execute(sock, jid, sender, args, m, { reply, commands }) {
    try {
      const sub = (args[0] || "menu").toLowerCase();

      if (sub === "menu" || sub === "help" || !sub) {
        const groups = await getGroups(sock);
        const botId = sock.user?.id ? sock.user.id.split(':')[0] : "Unknown";
        const botName = sock.user?.name || config.BOT_NAME || "Moonlight";
        const text =
`🤖 *BOT STATUS*

📛 Name: ${botName}
👥 Groups: ${groups.length}
👤 ID: ${botId}

📌 *Sub-commands:*
• .bot groups
• .bot gcs
• .bot leave <index>
• .bot gnf <index>
• .bot cmds`;

        if (config.MENU_IMAGE) {
          return sock.sendMessage(jid, {
            image: { url: config.MENU_IMAGE },
            caption: text
          }, { quoted: m });
        }

        return reply(text);
      }

      if (sub === "groups" || sub === "gcs") {
        const groups = await getGroups(sock);
        if (!groups.length) return reply("📋 The bot is not in any groups.");

        let text = "📋 *BOT GROUPS LIST*\n\n";

        groups.forEach((g, i) => {
          text += `${i + 1}. *${g.subject || "Unknown"}* (${groupType(g)})\n🆔 ID: ${g.id}\n👥 Members: ${g.participants?.length || "Unknown"}\n\n`;
        });

        const parts = text.match(/[\s\S]{1,3500}/g) || [];
        for (const part of parts) await reply(part);
        return;
      }

      if (sub === "leave") {
        const index = Number(args[1]);

        if (!Number.isInteger(index) || index < 1) {
          if (!jid.endsWith("@g.us")) return reply("❌ Usage: .bot leave <group index>\nUse `.bot groups` first.");
          await reply("👋 Leaving this group as requested...");
          return sock.groupLeave(jid);
        }

        const groups = await getGroups(sock);
        const group = groups[index - 1];
        if (!group) return reply("❌ Invalid group index. Use `.bot groups` first.");

        await reply(`👋 Leaving *${group.subject || "selected group"}*...`);
        return sock.groupLeave(group.id);
      }

      if (sub === "gnf" || sub === "info") {
        let targetJid = jid;
        const index = Number(args[1]);

        if (Number.isInteger(index) && index > 0) {
          const groups = await getGroups(sock);
          const group = groups[index - 1];
          if (!group) return reply("❌ Invalid group index. Use `.bot groups` first.");
          targetJid = group.id;
        }

        if (!targetJid.endsWith("@g.us")) return reply("❌ Usage: .bot gnf <group index>\nUse `.bot groups` first.");

        const metadata = await sock.groupMetadata(targetJid);
        const createdAt = metadata.creation ? new Date(metadata.creation * 1000).toDateString() : "Unknown";
        const owner = metadata.owner ? `@${metadata.owner.split('@')[0]}` : "Unknown";
        const mentions = metadata.owner ? [metadata.owner] : [];
        const text =
`ℹ️ *GROUP INFO*

📛 Name: ${metadata.subject || "Unknown"}
🆔 ID: ${metadata.id}
👥 Members: ${metadata.participants?.length || 0}
📅 Created: ${createdAt}
👑 Owner: ${owner}`;

        return sock.sendMessage(jid, { text, mentions }, { quoted: m });
      }

      if (sub === "cmds" || sub === "commands") {
        const categories = {};

        if (!commands) return reply("❌ Command system error.");

        for (const cmd of commands.values()) {
          const cat = cmd.category || "general";
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(cmd.name);
        }

        let text = "📜 *BOT COMMANDS LIST*\n";

        for (const cat of Object.keys(categories).sort()) {
          const names = [...new Set(categories[cat])].sort();
          text += `\n*${cat.toUpperCase()}*\n> ${names.join(", ")}\n`;
        }

        const parts = text.match(/[\s\S]{1,3500}/g) || [];
        for (const part of parts) await reply(part);
        return;
      }

      return reply(
`📌 *Bot Sub-commands*
.bot groups
.bot leave <index>
.bot gnf <index>
.bot cmds`
      );
    } catch (err) {
      console.error("BOT CMD ERROR:", err);
      return reply("❌ Failed to execute bot management command.");
    }
  }
});
