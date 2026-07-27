const os = require('os');
const {
  generateWAMessageFromContent,
  proto
} = require('@whiskeysockets/baileys');

moon({
  name: "stats",
  category: "general",
  description: "Show bot stats (snapshot UI)",

  async execute(sock, jid) {
    try {

      const uptime = process.uptime();

      const formatTime = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        return `${h}h ${m}m ${sec}s`;
      };

      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      let memPercent = (usedMem / totalMem) * 100;
      let cpuRaw = os.loadavg()[0] * 100;

      const clamp = (n) => {
        if (isNaN(n) || !isFinite(n)) return 0;
        return Math.max(0, Math.min(100, n));
      };

      const cpu = clamp(cpuRaw);
      memPercent = clamp(memPercent);

      const msg = generateWAMessageFromContent(
        jid,
        proto.Message.fromObject({
          pollResultSnapshotMessage:
            proto.Message.PollResultSnapshotMessage.fromObject({
              name: "📊 *MOONLIGHT SYSTEM STATUS*",
              pollVotes: [
                {
                  optionName: "⏳ UPTIME",
                  optionVoteCount: Math.floor(uptime)
                },
                {
                  optionName: "🧠 CPU %",
                  optionVoteCount: Math.floor(cpu)
                },
                {
                  optionName: "💾 RAM %",
                  optionVoteCount: Math.floor(memPercent)
                }
              ]
            })
        }),
        {}
      );

      await sock.relayMessage(jid, msg.message, {
        messageId: msg.key.id
      });

    } catch (err) {
      console.error("stats error:", err);
    }
  }
});