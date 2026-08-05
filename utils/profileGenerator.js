/**
 * utils/profileGenerator.js
 * Generates a profile image card for WhatsApp.
 * - Uses DEFAULT_ICON for unregistered users (no avatar set)
 * - Uses DEFAULT_BACKGROUND as fallback background
 * - Draws real decorative ring frames around the avatar
 * - Owner frames have animated multi-ring effect
 */
const { createCanvas, loadImage } = require("canvas");

const DEFAULT_ICON = "https://d.uguu.se/StNMkQts";
const DEFAULT_BACKGROUND = "https://d.uguu.se/StNMkQts";

const FRAMES = {
  classic:         { color: "#a78bfa", glow: "rgba(167,139,250,0.6)", gradient: null, ownerOnly: false, animated: false },
  sunset:          { color: "#fb923c", glow: "rgba(251,146,60,0.5)",  gradient: null, ownerOnly: false, animated: false },
  forest:          { color: "#16a34a", glow: "rgba(22,163,74,0.5)",   gradient: null, ownerOnly: false, animated: false },
  ocean:           { color: "#2563eb", glow: "rgba(37,99,235,0.5)",   gradient: null, ownerOnly: false, animated: false },
  twilight:        { color: "#a855f7", glow: "rgba(168,85,247,0.5)",  gradient: null, ownerOnly: false, animated: false },
  mint:            { color: "#14b8a6", glow: "rgba(20,184,166,0.5)",  gradient: null, ownerOnly: false, animated: false },
  coral:           { color: "#ec4899", glow: "rgba(236,72,153,0.5)",  gradient: null, ownerOnly: false, animated: false },
  silver:          { color: "#94a3b8", glow: "rgba(148,163,184,0.5)", gradient: null, ownerOnly: false, animated: false },
  owner_cosmic:    { color: "#a855f7", glow: "rgba(168,85,247,0.9)",  gradient: ["#a855f7","#3b82f6"], ownerOnly: true, animated: true },
  owner_flame:     { color: "#dc2626", glow: "rgba(220,38,38,0.9)",   gradient: ["#dc2626","#f59e0b"], ownerOnly: true, animated: true },
  owner_aurora:    { color: "#10b981", glow: "rgba(16,185,129,0.9)",  gradient: ["#10b981","#0ea5e9"], ownerOnly: true, animated: true },
  owner_void:      { color: "#7c3aed", glow: "rgba(124,58,237,0.9)",  gradient: ["#7c3aed","#1e1b4b"], ownerOnly: true, animated: true },
  owner_celestial: { color: "#fbbf24", glow: "rgba(251,191,36,0.9)",  gradient: ["#fbbf24","#f59e0b"], ownerOnly: true, animated: true },
};

async function loadImageSafe(url) {
  try { if (!url) return null; return await loadImage(url); } catch { return null; }
}

function drawCircularImage(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

function drawFrame(ctx, frameInfo, cx, cy, radius, animPhase = 0) {
  const { color, glow, gradient, animated } = frameInfo;
  ctx.save();
  ctx.shadowBlur = animated ? 30 : 18;
  ctx.shadowColor = glow;
  if (gradient) {
    const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    grad.addColorStop(0, gradient[0]);
    grad.addColorStop(1, gradient[1]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = gradient[0];
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (animated) {
      for (let i = 0; i < 6; i++) {
        const start = (i / 6) * Math.PI * 2 + animPhase;
        const end = start + Math.PI / 6;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 14, start, end);
        ctx.strokeStyle = gradient[i % 2 === 0 ? 0 : 1];
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.85;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

async function _renderFrame(data, animPhase) {
  const W = 500, H = 500;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bgUrl = data.bannerUrl || data.backgroundImage || DEFAULT_BACKGROUND;
  const bg = await loadImageSafe(bgUrl);
  if (bg) {
    const aspect = bg.width / bg.height;
    let dw, dh, dx, dy;
    if (aspect > 1) { dh = H; dw = dh * aspect; dx = (W - dw) / 2; dy = 0; }
    else             { dw = W; dh = dw / aspect; dx = 0; dy = (H - dh) / 2; }
    ctx.drawImage(bg, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, H);

  const avatarSize = 160;
  const avatarX = (W - avatarSize) / 2;
  const avatarY = 60;
  const cx = avatarX + avatarSize / 2;
  const cy = avatarY + avatarSize / 2;
  const r  = avatarSize / 2;

  const avatarUrl = data.avatarUrl || data.profileImage || DEFAULT_ICON;
  const avatar = await loadImageSafe(avatarUrl);
  const frameInfo = FRAMES[data.profileFrame] || FRAMES["classic"];
  drawFrame(ctx, frameInfo, cx, cy, r, animPhase);

  if (avatar) {
    drawCircularImage(ctx, avatar, avatarX, avatarY, avatarSize);
  } else {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#1e1b4b"; ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 48px Sans";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText((data.username || "?")[0].toUpperCase(), cx, cy);
    ctx.restore();
  }

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffcc00"; ctx.font = "bold 30px Sans";
  ctx.shadowBlur = 8; ctx.shadowColor = "rgba(255,204,0,0.4)";
  ctx.fillText(data.username || "Unknown", W / 2, 268);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#c4b5fd"; ctx.font = "italic 16px Sans";
  ctx.fillText(`✦ ${data.role || "Moon Citizen"} ✦`, W / 2, 292);
  ctx.fillStyle = "#e2e8f0"; ctx.font = "18px Sans";
  ctx.fillText(`Rank ${data.rank || 0}  •  Level ${data.level || 1}`, W / 2, 320);

  const bW = 300, bH = 18, bX = (W - bW) / 2, bY = 338;
  const prog = Math.min((data.xp || 0) / Math.max(data.xpTarget || 100, 1), 1);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, 9); ctx.fill();
  if (prog > 0) {
    const g = ctx.createLinearGradient(bX, bY, bX + bW, bY);
    g.addColorStop(0, "#6d28d9"); g.addColorStop(1, "#3b82f6");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(bX, bY, bW * prog, bH, 9); ctx.fill();
  }
  ctx.fillStyle = "#ffffff"; ctx.font = "12px Sans";
  ctx.fillText(`${data.xp || 0} / ${data.xpTarget || 100} XP`, W / 2, bY + 13);

  ctx.textAlign = "left"; ctx.font = "14px Sans"; ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`💰 ${(data.balance || data.bank || 0).toLocaleString()}`, 16, 26);
  ctx.fillText(`👛 ${(data.wallet || 0).toLocaleString()}`, 16, 46);
  ctx.textAlign = "right";
  ctx.fillText(`🃏 ${data.cardCount || (data.cards && data.cards.length) || 0} cards`, W - 16, 26);

  ctx.strokeStyle = "rgba(167,139,250,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 380); ctx.lineTo(W - 40, 380); ctx.stroke();

  const sY = 400, c1 = W / 4, c2 = W / 2, c3 = (W * 3) / 4;
  ctx.textAlign = "center"; ctx.font = "13px Sans"; ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("MESSAGES", c1, sY); ctx.fillStyle = "#a78bfa"; ctx.font = "bold 16px Sans"; ctx.fillText(data.messageCount || 0, c1, sY + 20);
  ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "13px Sans"; ctx.fillText("BALANCE", c2, sY);
  ctx.fillStyle = "#fbbf24"; ctx.font = "bold 16px Sans"; ctx.fillText((data.balance || 0).toLocaleString(), c2, sY + 20);
  ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "13px Sans"; ctx.fillText("CARDS", c3, sY);
  ctx.fillStyle = "#34d399"; ctx.font = "bold 16px Sans"; ctx.fillText(data.cardCount || (data.cards && data.cards.length) || 0, c3, sY + 20);

  ctx.textAlign = "center"; ctx.font = "bold 14px Sans"; ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("𝕄𝕆𝕆ℕ𝕃𝕀𝔾ℍ𝕋 • ℙℝ𝕆𝔽𝕀𝕃𝔼", W / 2, 478);

  return canvas.toBuffer();
}

async function generateProfileImage(data) {
  return _renderFrame(data, 0);
}

async function generateAnimatedProfileFrames(data, frameCount = 8) {
  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    frames.push(await _renderFrame(data, (i / frameCount) * Math.PI * 2));
  }
  return frames;
}

module.exports = { generateProfileImage, generateAnimatedProfileFrames, FRAMES, DEFAULT_ICON, DEFAULT_BACKGROUND };
