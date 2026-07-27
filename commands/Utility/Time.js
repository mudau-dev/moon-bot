const moment = require('moment-timezone');

moon({
  name: "time",
  category: "Utility",
  description: "Check current time",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      const timezone = "Africa/Johannesburg"; // change if needed

      const now = moment().tz(timezone);

      // ✅ 12-hour format with AM/PM
      const time = now.format("hh:mm:ss A");
      const date = now.format("dddd, DD MMMM YYYY");

      const msg = `
🕒 *Current Time*

📅 Date: ${date}
⏰ Time: ${time}
🌍 Zone: ${timezone}
      `.trim();

      return reply(msg);

    } catch (err) {
      console.error("time cmd error:", err);
      return reply("❌ Failed to fetch time.");
    }
  }
});