const { suspendUser } = require('../../utils/modTools');
const { isMod } = require('../../database/users');

function parseDuration(input) {
  if (!input) return { ms: 0, label: "Permanent", consumed: false };
  const match = String(input).toLowerCase().match(/^(\d+)(s|m|h|d)$/);
  if (!match) return { ms: 0, label: "Permanent", consumed: false };
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000
  };
  return {
    ms: value * multipliers[unit],
    label: `${value}${unit}`,
    consumed: true
  };
}

moon({
  name: "suspend",
  category: "owner",
  roles: ["Mod", "Owner", "True Owner"],
  description: "Suspend a user from using commands",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
    
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
      const rawTarget = mentioned || quoted || args[0];
      
      if (!rawTarget) {
        return reply("❌ Please mention a user, reply to a user, or provide their number.");
      }
      
      const targetNumber = String(rawTarget).replace(/[^0-9]/g, '');
      if (!targetNumber) return reply("❌ Invalid user target.");
      const target = `${targetNumber}@s.whatsapp.net`;
      
      let timeIndex = (mentioned || quoted) ? 0 : 1;
      const duration = parseDuration(args[timeIndex]);
      if (duration.consumed) timeIndex++;
      
      const reason = args.slice(timeIndex).join(" ").trim() || "No reason provided";
      const res = await suspendUser(target, duration.ms, reason, sender);
      
      if (!res.ok) return reply(res.message);
      
      let timeLeft = duration.label;
      if (duration.ms > 0) {
        const diff = duration.ms;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        timeLeft = `${days}d: ${hours}h: ${minutes}m`;
      } else {
        timeLeft = "Permanent";
      }
      
      const text = 
        `✅ *USER SUSPENDED*\n` +
        `👤 *Target:* @${targetNumber}\n` +
        `⏳ *Duration:* \`${timeLeft}\`\n` +
        `📌 *Reason:* ${reason}`;
        
      return sock.sendMessage(jid, {
        text,
        mentions: [target]
      }, { quoted: m });
    } catch (err) {
      console.error("SUSPEND ERROR:", err);
      return reply("❌ Failed to suspend user.");
    }
  }
});
