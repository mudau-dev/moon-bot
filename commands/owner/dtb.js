const os = require('os');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Card = require('../../models/Card');

const {
  generateWAMessageFromContent,
  proto
} = require('@whiskeysockets/baileys');

moon({
  name: "dtb",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Moonlight diagnostic dashboard (polo style)",

  async execute(sock, jid, sender, args, m) {
    try {


      
      // ================= SYSTEM =================
      const mem = process.memoryUsage();

      const rss = mem.rss / 1024 / 1024;
      const heapUsed = mem.heapUsed / 1024 / 1024;
      const heapTotal = mem.heapTotal / 1024 / 1024;

      const uptime = process.uptime();

      const load = os.loadavg();
      const cpuCount = os.cpus().length;

      const cpuPressure = load[0] / cpuCount;

      // ================= DATABASE =================
      const users = await User.countDocuments();
      const cards = await Card.countDocuments();

      const db = mongoose.connection.db;
      const stats = await db.stats();

      const toMB = (v) => (v / (1024 * 1024));

      const usedMB = toMB(stats.dataSize);
      const storageMB = toMB(stats.storageSize);
      const indexMB = toMB(stats.indexSize);

      // ================= ECONOMY =================
      const allUsers = await User.find({}, 'balance bank');

      let totalEconomy = 0;
      for (const u of allUsers) {
        totalEconomy += (u.balance || 0) + (u.bank || 0);
      }

      // ================= CAP SETTINGS =================
      const DB_CAP_MB = 500;
      const USER_CAP = 100000;

      const dbLeft = Math.max(DB_CAP_MB - usedMB, 0);
      const userIndex = (users / USER_CAP) * 100;

      // ================= STATUS =================
      let status = "🟢 Healthy";
      if (cpuPressure > 3) status = "🔴 High Load";
      else if (cpuPressure > 1.5) status = "🟠 Medium Load";

      // ================= POLL SNAPSHOT =================
      const msg = generateWAMessageFromContent(
        jid,
        proto.Message.fromObject({
          pollResultSnapshotMessage:
            proto.Message.PollResultSnapshotMessage.fromObject({
              name:
`🧠 𝚳OO𝚴𝐋𝐈𝐆𝐇𝐓 DTB SYSTEM REPORT

DATABASE + SYSTEM SNAPSHOT`,

              pollVotes: [
                { optionName: "👥 USERS", optionVoteCount: users },
                { optionName: "📦 CARDS CREATED", optionVoteCount: cards },
                { optionName: "💰 ECONOMY", optionVoteCount: Number(totalEconomy.toString().slice(0, 9)) || 0 },
                { optionName: "🗄️ DB USED (MB)", optionVoteCount: Math.floor(usedMB) },
                { optionName: "📊 DB LEFT (MB)", optionVoteCount: Math.floor(dbLeft) },
                { optionName: "🧾 INDEX (MB)", optionVoteCount: Math.floor(indexMB) },
                { optionName: "📈 USER CAP % (100K)", optionVoteCount: Math.floor(userIndex) }
              ]
            })
        }),
        { quoted: m }
      );

      await sock.relayMessage(jid, msg.message, {
        messageId: msg.key.id
      });

    } catch (err) {
      console.error("DTB error:", err);
    }
  }
});