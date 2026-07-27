/**
 * utils/legacyImageGen.js
 *
 * REDESIGNED: Avatar in corner (large square), stats on right.
 * Uses high-quality fantasy backgrounds.
 */

const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

// ─────────────────────────────────────────────────────────────────────────────
// ASSETS & CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const BG_URLS = {
  profile: 'https://files.catbox.moe/k3b4t0.jpg', // Fantasy landscape
  battle:  'https://files.catbox.moe/qxd31v.jpg', // Dark dungeon/arena
  victory: 'https://files.catbox.moe/k3b4t0.jpg', // Heavenly light
  defeat:  'https://files.catbox.moe/qxd31v.jpg', // Dark red abyss
};

const CLASS_COLORS = { Mage: '#9b59b6', Warrior: '#e74c3c', Assassin: '#2ecc71', Archer: '#27ae60', Paladin: '#f39c12', Guardian: '#95a5a6' };
const CLASS_ICONS  = { Mage: '🔮', Warrior: '⚔️', Assassin: '🗡️', Archer: '🏹', Paladin: '🛡️', Guardian: '🤖' };

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function loadImageSafe(url) {
  if (!url) return null;
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    return await loadImage(Buffer.from(res.data));
  } catch { return null; }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBar(ctx, x, y, w, h, current, max, colorA, colorB, label) {
  const pct = max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  if (pct > 0) {
    const grad = ctx.createLinearGradient(x, y, x + w * pct, y);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w * pct, h, 6);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();
  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Sans';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h - 4);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE CARD (.me) - REDESIGNED
// ─────────────────────────────────────────────────────────────────────────────
async function generateLegacyProfileCard(p, avatarUrl) {
  const W = 1000, H = 600;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const bg = await loadImageSafe(BG_URLS.profile);
  if (bg) {
    const scale = Math.max(W / bg.width, H / bg.height);
    ctx.drawImage(bg, (W - bg.width * scale) / 2, (H - bg.height * scale) / 2, bg.width * scale, bg.height * scale);
  }
  ctx.fillStyle = 'rgba(0,0,15,0.8)';
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 5;
  roundRect(ctx, 15, 15, W - 30, H - 30, 20);
  ctx.stroke();

  // LEFT SIDE: Large Square Avatar + Name + Class
  const avX = 50, avY = 50, avSize = 300;
  const avatar = await loadImageSafe(avatarUrl);
  
  // Avatar Frame
  ctx.fillStyle = '#000';
  ctx.fillRect(avX, avY, avSize, avSize);
  if (avatar) {
    ctx.drawImage(avatar, avX, avY, avSize, avSize);
  } else {
    ctx.fillStyle = '#222';
    ctx.fillRect(avX, avY, avSize, avSize);
    ctx.fillStyle = '#444';
    ctx.font = '100px Sans';
    ctx.textAlign = 'center';
    ctx.fillText('👤', avX + avSize/2, avY + avSize/2 + 30);
  }
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 4;
  ctx.strokeRect(avX, avY, avSize, avSize);

  // Name & Class Underneath
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px Sans';
  ctx.textAlign = 'left';
  ctx.fillText(p.name || 'Unknown', avX, avY + avSize + 60);

  const cls = p.class || 'None';
  ctx.fillStyle = CLASS_COLORS[cls] || '#aaa';
  ctx.font = 'bold 24px Sans';
  ctx.fillText(`${CLASS_ICONS[cls] || ''} ${cls}`, avX, avY + avSize + 100);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'italic 20px Sans';
  ctx.fillText(`Rank: ${p.rank || 'Commoner'}`, avX, avY + avSize + 135);

  // RIGHT SIDE: Stats & Bars
  const startX = 400;
  
  // HP Bar
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 18px Sans';
  ctx.fillText('❤️ HP', startX, 70);
  drawBar(ctx, startX, 80, 530, 30, p.hp, p.maxHp, '#7b241c', '#e74c3c', `${p.hp} / ${p.maxHp}`);

  // Mana Bar
  ctx.fillStyle = '#74b9ff';
  ctx.font = 'bold 18px Sans';
  ctx.fillText('💧 Mana', startX, 140);
  drawBar(ctx, startX, 150, 530, 30, p.mana, p.maxMana, '#1a5276', '#2980b9', `${p.mana} / ${p.maxMana}`);

  // XP Bar
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 18px Sans';
  ctx.fillText('✨ XP', startX, 210);
  drawBar(ctx, startX, 220, 530, 30, p.xp, p.xpToNext, '#7d6608', '#d4ac0d', `${p.xp} / ${p.xpToNext}`);

  // Stats Grid
  const stats = [
    { l: 'Level', v: p.level },
    { l: 'Gold', v: (p.gold || 0).toLocaleString() },
    { l: 'Wins', v: p.wins },
    { l: 'Losses', v: p.losses },
    { l: 'ATK', v: p.attack },
    { l: 'DEF', v: p.defense },
    { l: 'Stage', v: p.stage },
    { l: 'Progress', v: `${p.stageProgress}%` },
  ];

  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * 270;
    const y = 300 + row * 65;
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, x, y, 250, 50, 8);
    ctx.fill();
    
    ctx.fillStyle = '#aaa';
    ctx.font = '16px Sans';
    ctx.textAlign = 'left';
    ctx.fillText(s.l, x + 15, y + 32);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Sans';
    ctx.textAlign = 'right';
    ctx.fillText(String(s.v), x + 235, y + 32);
  });

  return canvas.toBuffer('image/png');
}

// ─────────────────────────────────────────────────────────────────────────────
// BATTLE CARD
// ─────────────────────────────────────────────────────────────────────────────
async function generateBattleCard(p1, p2, round, currentTurnName) {
  const W = 1000, H = 500;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const bg = await loadImageSafe(BG_URLS.battle);
  if (bg) {
    const scale = Math.max(W / bg.width, H / bg.height);
    ctx.drawImage(bg, (W - bg.width * scale) / 2, (H - bg.height * scale) / 2, bg.width * scale, bg.height * scale);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, W, H);

  // VS Line
  ctx.strokeStyle = 'rgba(255,215,0,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W/2, 50);
  ctx.lineTo(W/2, H-50);
  ctx.stroke();

  // P1 (Left)
  const av1 = await loadImageSafe(p1.avatarUrl);
  if (av1) ctx.drawImage(av1, 100, 80, 150, 150);
  ctx.strokeStyle = '#ffd700';
  ctx.strokeRect(100, 80, 150, 150);
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Sans';
  ctx.textAlign = 'center';
  ctx.fillText(p1.name, 175, 260);
  drawBar(ctx, 50, 280, 250, 20, p1.hp, p1.maxHp, '#7b241c', '#e74c3c', `HP: ${p1.hp}`);
  drawBar(ctx, 50, 310, 250, 20, p1.mana, p1.maxMana, '#1a5276', '#2980b9', `MP: ${p1.mana}`);

  // P2 (Right)
  const av2 = await loadImageSafe(p2.avatarUrl);
  if (av2) ctx.drawImage(av2, W - 250, 80, 150, 150);
  ctx.strokeStyle = '#e74c3c';
  ctx.strokeRect(W - 250, 80, 150, 150);
  
  ctx.fillStyle = '#fff';
  ctx.fillText(p2.name, W - 175, 260);
  drawBar(ctx, W - 300, 280, 250, 20, p2.hp, p2.maxHp, '#7b241c', '#e74c3c', `HP: ${p2.hp}`);
  drawBar(ctx, W - 300, 310, 250, 20, p2.mana, p2.maxMana, '#1a5276', '#2980b9', `MP: ${p2.mana}`);

  // Center Info
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 60px Sans';
  ctx.fillText('VS', W/2, 180);
  ctx.font = '20px Sans';
  ctx.fillText(`Round ${round}`, W/2, 220);
  
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  roundRect(ctx, W/2 - 150, 350, 300, 60, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Sans';
  ctx.fillText(`TURN: ${currentTurnName}`, W/2, 388);

  return canvas.toBuffer('image/png');
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT CARD
// ─────────────────────────────────────────────────────────────────────────────
async function generateResultCard(type, p) {
  const W = 800, H = 500;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const isWin = type === 'victory';

  const bg = await loadImageSafe(isWin ? BG_URLS.victory : BG_URLS.defeat);
  if (bg) {
    const scale = Math.max(W / bg.width, H / bg.height);
    ctx.drawImage(bg, (W - bg.width * scale) / 2, (H - bg.height * scale) / 2, bg.width * scale, bg.height * scale);
  }
  ctx.fillStyle = isWin ? 'rgba(0,20,0,0.8)' : 'rgba(20,0,0,0.8)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = isWin ? '#ffd700' : '#ff4444';
  ctx.font = 'bold 80px Sans';
  ctx.textAlign = 'center';
  ctx.fillText(isWin ? 'VICTORY' : 'DEFEAT', W/2, 120);

  const av = await loadImageSafe(p.avatarUrl);
  if (av) ctx.drawImage(av, W/2 - 75, 150, 150, 150);
  ctx.strokeStyle = isWin ? '#ffd700' : '#ff4444';
  ctx.strokeRect(W/2 - 75, 150, 150, 150);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px Sans';
  ctx.fillText(p.name, W/2, 340);
  
  ctx.font = '24px Sans';
  ctx.fillText(`+${p.xpEarned} XP  |  +${p.goldEarned} Gold`, W/2, 380);
  
  if (p.newLevel) {
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 32px Sans';
    ctx.fillText(`LEVEL UP! → ${p.newLevel}`, W/2, 430);
  }

  return canvas.toBuffer('image/png');
}

async function generateLegacyInfoBanner() {
  const W = 900, H = 500;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050010';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 50px Sans';
  ctx.textAlign = 'center';
  ctx.fillText('MOONLIGHT LEGACY', W/2, 200);
  ctx.font = '20px Sans';
  ctx.fillText('A Persistent Fantasy RPG', W/2, 250);
  return canvas.toBuffer('image/png');
}

module.exports = {
  generateLegacyProfileCard,
  generateBattleCard,
  generateResultCard,
  generateLegacyInfoBanner,
};
