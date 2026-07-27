// commands/group/greject.js

const config = require('../../config');

moon({
  name: "greject",
  category: "group",
  description: "Reject all pending group join requests",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      if (!jid || !jid.endsWith("@g.us")) {
        return reply("❌ This command only works in groups.");
      }

      const metadata = await sock.groupMetadata(jid);

      // ---------------- USER CHECK ----------------
      const userParticipant = metadata.participants.find(
        p => p.id === sender
      );

      const isUserAdmin =
        userParticipant?.admin === "admin" ||
        userParticipant?.admin === "superadmin";

      if (!isUserAdmin) {
        return reply("❌ You must be a group admin.");
      }

      // ---------------- BOT CHECK ----------------
      const botJid = config.BOT_JID;

      const botParticipant = metadata.participants.find(
        p => p.id === botJid
      );

      const isBotAdmin =
        botParticipant?.admin === "admin" ||
        botParticipant?.admin === "superadmin";

      if (!isBotAdmin) {
        return reply("❌ Bot must be admin to reject requests.");
      }

      // ---------------- REQUESTS ----------------
      const requests = await sock.groupRequestParticipantsList(jid);

      if (!requests || requests.length === 0) {
        return reply("❌ No pending join requests found.");
      }

      let rejected = 0;

      for (const user of requests) {
        try {

          await sock.groupRequestParticipantsUpdate(
            jid,
            [user.jid],
            "reject"
          );

          rejected++;

        } catch (err) {
          console.log(`Failed rejecting ${user.jid}:`, err);
        }
      }

      return reply(`✅ Rejected ${rejected} request(s).`);

    } catch (err) {
      console.error("greject error:", err);
      return reply("❌ Failed to reject requests.");
    }
  }
});

moon({
  name: "gapprove",
  category: "group",
  description: "Approve all pending group join requests",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      if (!jid || !jid.endsWith("@g.us")) {
        return reply("❌ This command only works in groups.");
      }

      const metadata = await sock.groupMetadata(jid);

      // ---------------- USER CHECK ----------------
      const userParticipant = metadata.participants.find(
        p => p.id === sender
      );

      const isUserAdmin =
        userParticipant?.admin === "admin" ||
        userParticipant?.admin === "superadmin";

      if (!isUserAdmin) {
        return reply("❌ You must be a group admin.");
      }

      // ---------------- BOT CHECK ----------------
      const botJid = config.BOT_JID;

      const botParticipant = metadata.participants.find(
        p => p.id === botJid
      );

      const isBotAdmin =
        botParticipant?.admin === "admin" ||
        botParticipant?.admin === "superadmin";

      if (!isBotAdmin) {
        return reply("❌ Bot must be admin to approve requests.");
      }

      // ---------------- REQUESTS ----------------
      const requests = await sock.groupRequestParticipantsList(jid);

      if (!requests || requests.length === 0) {
        return reply("❌ No pending join requests found.");
      }

      let approved = 0;

      for (const user of requests) {
        try {

          await sock.groupRequestParticipantsUpdate(
            jid,
            [user.jid],
            "approve"
          );

          approved++;

        } catch (err) {
          console.log(`Failed approving ${user.jid}:`, err);
        }
      }

      return reply(`✅ Approved ${approved} request(s).`);

    } catch (err) {
      console.error("gapprove error:", err);
      return reply("❌ Failed to approve requests.");
    }
  }
});