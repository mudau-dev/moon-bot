moon({
  name: "cjid",
  aliases: ["communityid"],
  category: "group",
  description: "Get the Community ID of the current group.",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith("@g.us")) {
        return reply("❌ This command can only be used in groups.");
      }

      const metadata = await sock.groupMetadata(jid);

      // Baileys stores the parent community here
      const communityId =
        metadata.linkedParent ||
        metadata.parent ||
        metadata.parentJid ||
        metadata.community ||
        metadata.communityJid ||
        null;

      if (!communityId) {
        return reply("❌ This group is not part of any community.");
      }

      return reply(
`🌙 *COMMUNITY INFORMATION*

🆔 Community ID:
${communityId}

📋 You can use this ID in your configuration or commands.`
      );

    } catch (err) {
      console.error("[CJID]", err);
      return reply("❌ Failed to fetch community information.");
    }
  }
});