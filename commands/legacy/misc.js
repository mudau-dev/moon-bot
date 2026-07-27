/**
 * commands/legacy/misc.js
 * Handles the complete Moonlight Legacy utility set.
 */
const LegacyPlayer = require('../../models/LegacyPlayer');


// Rest of utility commands (status, honor, legends, etc.)
moon({
  name: 'status',
  aliases: ['stats'],
  category: 'legacy',
  async execute(sock, jid, sender, args, m, { reply }) {
    const p = await LegacyPlayer.findOne({ whatsappId: sender }).lean();
    if (!p) return reply('❌ No Legacy account. Use *.genesis* first.');
    return reply(`📊 *${p.name}'s Status*\n\n❤️ HP: ${p.hp}/${p.maxHp}\n💧 Mana: ${p.mana}/${p.maxMana}\n✨ XP: ${p.xp}/${p.xpToNext}\n⚔️ ATK: ${p.attack} | 🛡️ DEF: ${p.defense}\n📊 Level: ${p.level} | 🏅 Rank: ${p.rank}\n💰 Gold: ${p.gold.toLocaleString()}`);
  }
});

moon({
  name: 'skills',
  category: 'legacy',
  async execute(sock, jid, sender, args, m, { reply }) {
    const p = await LegacyPlayer.findOne({ whatsappId: sender }).lean();
    if (!p) return reply('❌ No Legacy account. Use *.genesis* first.');
    if (!p.skills || !p.skills.length) return reply('❌ No skills yet. Use *.choose*.');
    return reply(`⚡ *${p.name}'s Skills*\n\n${p.skills.map(s => `• ${s}`).join('\n')}\n\n> Use *.skill-list* to see all 50 possible skills.`);
  }
});

moon({
  name: 'honor',
  category: 'legacy',
  async execute(sock, jid, sender, args, m, { reply }) {
    const p = await LegacyPlayer.findOne({ whatsappId: sender }).lean();
    if (!p) return reply('❌ No Legacy account. Use *.genesis* first.');
    return reply(`🏅 *${p.name}'s Honor*\n\nRank: *${p.rank}*\nLevel: ${p.level}\nXP: ${p.xp}/${p.xpToNext}\n\n> Progress stages with *.challenge* to rank up!`);
  }
});

moon({
  name: 'history',
  category: 'legacy',
  async execute(sock, jid, sender, args, m, { reply }) {
    const p = await LegacyPlayer.findOne({ whatsappId: sender }).lean();
    if (!p) return reply('❌ No Legacy account. Use *.genesis* first.');
    const hist = (p.battleHistory || []).slice(-5).reverse();
    if (!hist.length) return reply('📜 No battle history yet.');
    const list = hist.map(b => `${b.result === 'win' ? '🏆' : '💀'} vs ${b.opponent} (+${b.xpEarned} XP)`).join('\n');
    return reply(`📜 *Battle History*\n\n${list}`);
  }
});

moon({
  name: 'legends',
  category: 'legacy',
  async execute(sock, jid, sender, args, m, { reply }) {
    const top = await LegacyPlayer.find({ class: { $ne: null } }).sort({ level: -1, wins: -1 }).limit(10).lean();
    if (!top.length) return reply('📜 No legends yet.');
    const list = top.map((p, i) => `${i+1}. ${p.name} (Lv.${p.level})`).join('\n');
    return reply(`🏆 *MOONLIGHT LEGENDS*\n\n${list}`);
  }
});

moon({
  name: 'blessing',
  category: 'legacy',
  async execute(sock, jid, sender, args, m, { reply }) {
    const p = await LegacyPlayer.findOne({ whatsappId: sender });
    if (!p) return reply('❌ No Legacy account. Use *.genesis* first.');
    const now = new Date();
    if (p.lastBlessing && (now - p.lastBlessing < 86400000)) return reply('⏳ Already claimed today.');
    p.xp += 100; p.gold += 200; p.lastBlessing = now;
    await p.save();
    return reply('🌙 *Daily Blessing Claimed!*\n✨ +100 XP  💰 +200 Gold');
  }
});

moon({
  name: 'rgp',
  category: 'legacy',
  async execute(sock, jid, sender, args, m, { reply }) {
    const p = await LegacyPlayer.findOne({ whatsappId: sender }).lean();
    const stage = p ? p.stage : 1;
    return reply(`📜 *Legacy Stages*\n\nCurrent Stage: *${stage} / 30*\nProgress: ${p ? p.stageProgress : 0}%\n\n> Use *.challenge start* to progress!`);
  }
});

moon({
  name: 'objective',
  category: 'legacy',
  async execute(sock, jid, sender, args, m, { reply }) {
    const p = await LegacyPlayer.findOne({ whatsappId: sender }).lean();
    if (!p) return reply('❌ No Legacy account. Use *.genesis* first.');
    return reply(`🎯 *Current Objective*\n\nStage ${p.stage}: Win battles against the bot Guardian to reach 100% progress and claim rewards!`);
  }
});
