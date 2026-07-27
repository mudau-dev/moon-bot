const GroupSettings = require("../../models/athers/GroupSettings");
const config = require("../../config");

moon({
  name: "welcome",
  aliases: [],
  category: "group",
  description: "Manage welcome messages.",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      if (!jid.endsWith("@g.us")) {
        return reply("❌ This command can only be used in groups.");
      }

      const metadata = await sock.groupMetadata(jid);

      // User admin check
      const senderParticipant = metadata.participants.find(
        p => p.id === sender
      );

      if (
        !senderParticipant ||
        (senderParticipant.admin !== "admin" &&
          senderParticipant.admin !== "superadmin")
      ) {
        return reply("❌ You must be a group admin to use this command.");
      }

      // Bot admin check
      const botParticipant = metadata.participants.find(
        p => p.id === config.BOT_JID
      );

      if (
        !botParticipant ||
        (botParticipant.admin !== "admin" &&
          botParticipant.admin !== "superadmin")
      ) {
        return reply("❌ I need to be a group admin first.");
      }

      const sub = (args[0] || "").toLowerCase();

      switch (sub) {
        case "on":
          GroupSettings.updateGroup(jid, {
            welcomeEnabled: true
          });

          return reply("✅ Welcome messages enabled.");

        case "off":
          GroupSettings.updateGroup(jid, {
            welcomeEnabled: false
          });

          return reply("❌ Welcome messages disabled.");

        case "set": {
          const message = args.slice(1).join(" ");

          if (!message) {
            return reply(
              "Usage:\n" +
              ".welcome set <message>\n\n" +
              "Available placeholders:\n" +
              "@user\n" +
              "@gname\n" +
              "@count\n" +
              "@p"
            );
          }

          GroupSettings.updateGroup(jid, {
            welcomeMessage: message
          });

          return reply("✅ Welcome message updated.");
        }

        default: {
          const group = GroupSettings.getGroup(jid);

          return reply(
`🌙 *Welcome Settings*

Status: ${group.welcomeEnabled ? "✅ Enabled" : "❌ Disabled"}

Message:
${group.welcomeMessage}

*Available Commands:*
• .welcome on
• .welcome off
• .welcome set <message>

*Placeholders:*
@user - fore geting user taged
@gname - to get group name mentioned 
@count - to count current members in group
@p - to show user profile at top`
          );
        }
      }

    } catch (err) {
      console.error("[WELCOME]", err);
      return reply("❌ " + err.message);
    }
  }
});