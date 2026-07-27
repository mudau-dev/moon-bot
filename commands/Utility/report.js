const Report = require('../../models/athers/Report');

moon({
  name: "report",
  category: "Utility",
  description: "Submit a report",
  usage: ".report <message>",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      const text = args.join(" ").trim();

      if (!text) {
        return reply("❌ Usage:\n.report <message>");
      }

      const senderNumber = sender.split('@')[0];

      await Report.create({
        userId: senderNumber,
        jid,
        message: text
      });

      return reply("✅ Report submitted.");

    } catch (err) {
      console.error("Report error:", err);
      return reply("❌ Failed to submit report.");
    }
  }
});