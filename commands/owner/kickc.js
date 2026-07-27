const KickRequest = require("../../models/athers/KickRequest");
const { checkUserRole } = require("../../handler/roleChecker");

moon({
  name: "kickc",
  aliases: ["communitykick"],
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Kick a user or group from the Moonlight Community.",

  async execute(sock, jid, sender, args, m, { reply, prefix }) {
    try {
      const communityId = process.env.COMMUNITY;

      if (!communityId) {
        return reply("❌ COMMUNITY ID is not configured.");
      }

      const context =
        m.message?.extendedTextMessage?.contextInfo ||
        m.message?.imageMessage?.contextInfo ||
        m.message?.videoMessage?.contextInfo ||
        {};

      const target =
        context.mentionedJid?.[0] ||
        context.participant ||
        args[0];

      if (!target) {
        return reply(
          `> ❌ Mention/reply to a user or provide a group JID.\n\nUsage:\n${prefix}kickc @user\n${prefix}kickc 123456@g.us`
        );
      }

      const targetJid = target.includes("@")
        ? target
        : `${target}@s.whatsapp.net`;

      const isGroupKick =
        targetJid.endsWith("@g.us") &&
        !targetJid.includes("-");

      const senderRole = await checkUserRole(sender, [
        "Mod",
        "Owner",
        "True Owner"
      ]);

      if (isGroupKick) {
        if (senderRole.role !== "True Owner") {
          return reply("❌ Only owner can remove groups from the community.");
        }
      } else {
        const staff = await checkUserRole(targetJid, [
          "Mod",
          "Owner",
          "True Owner",
          "CDC"
        ]);

        if (staff.allowed) {
          return reply("❌ You cannot remove *Moon lord*.");
        }
      }

      const metadata = await sock.groupMetadata(communityId).catch(() => null);

      if (!metadata) {
        return reply("❌ Failed to load community.");
      }

      const botJid =
        sock.user.id.split(":")[0] + "@s.whatsapp.net";

      const bot = metadata.participants.find(
        p => p.id === botJid
      );

      if (bot?.admin) {
        await sock.groupParticipantsUpdate(
          communityId,
          [targetJid],
          "remove"
        );

        return reply(
          `✅ Successfully removed ${
            isGroupKick ? "the group" : "the user"
          } from the Moonlight Community.`
        );
      }

      await KickRequest.create({
        targetJid,
        communityJid: communityId,
        requesterJid: sender
      });

      return reply(
        "⏳ I am not an admin in the community.\n\nA request has been sent to another Moonlight bots that has permission to perform the removal."
      );

    } catch (err) {
      console.error("[KICKC]", err);
      return reply("❌ Failed to remove the target from the community.");
    }
  }
});