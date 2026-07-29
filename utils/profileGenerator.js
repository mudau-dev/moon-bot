const { createCanvas, loadImage, registerFont } = require("canvas");

// Mappings for frames from moon-web/lib/profileFrames.ts
const FRAME_OVERLAYS = {
  'classic': { color: '#a78bfa', glow: 'rgba(167, 139, 250, 0.5)' },
  'moonviolet': { color: '#9d4edd', glow: 'rgba(157, 78, 221, 0.8)' },
  'cyan': { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
  'gold': { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)' },
  'emerald': { color: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },
  'rose': { color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)' },
  'sky': { color: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.5)' },
  'sunset': { color: '#fb923c', glow: 'rgba(251, 146, 60, 0.5)' },
  'forest': { color: '#16a34a', glow: 'rgba(22, 163, 74, 0.5)' },
  'ocean': { color: '#2563eb', glow: 'rgba(37, 99, 235, 0.5)' },
  'twilight': { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
  'mint': { color: '#14b8a6', glow: 'rgba(20, 184, 166, 0.5)' },
  'lavender': { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.5)' },
  'coral': { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)' },
  'silver': { color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.5)' },
  'owner_cosmic': { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.8)', gradient: ['#a855f7', '#3b82f6'] },
  'owner_flame': { color: '#dc2626', glow: 'rgba(220, 38, 38, 0.8)', gradient: ['#dc2626', '#f59e0b'] },
  'owner_aurora': { color: '#10b981', glow: 'rgba(16, 185, 129, 0.8)', gradient: ['#10b981', '#0ea5e9'] },
  'owner_void': { color: '#7c3aed', glow: 'rgba(124, 58, 237, 0.8)', gradient: ['#7c3aed', '#000000'] },
  'owner_celestial': { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)', gradient: ['#fbbf24', '#f59e0b'] },
};

async function loadImageSafe(url) {
  try {
    if (!url) return null;
    return await loadImage(url);
  } catch {
    return null;
  }
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

async function generateProfileImage(data) {
  const width = 500;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. Background
  const bg = await loadImageSafe(data.bannerUrl || data.backgroundImage || "https://i.ibb.co/L50k8fW/haven-festival.jpg");
  if (bg) {
    const aspect = bg.width / bg.height;
    let dw, dh, dx, dy;
    if (aspect > 1) {
      dh = height;
      dw = dh * aspect;
      dx = (width - dw) / 2;
      dy = 0;
    } else {
      dw = width;
      dh = dw / aspect;
      dx = 0;
      dy = (height - dh) / 2;
    }
    ctx.drawImage(bg, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);
  }

  // Overlay for readability
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(0, 0, width, height);

  // 2. Avatar
  const avatarSize = 160;
  const avatarX = (width - avatarSize) / 2;
  const avatarY = 80;
  
  const avatar = await loadImageSafe(data.avatarUrl || data.profileImage || "https://ui-avatars.com/api/?name=" + (data.username || "U"));
  
  // Frame settings
  const frameInfo = FRAME_OVERLAYS[data.profileFrame] || FRAME_OVERLAYS['classic'];
  
  // Draw glow
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = frameInfo.glow;
  ctx.beginPath();
  ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
  ctx.strokeStyle = frameInfo.color;
  ctx.lineWidth = 4;
  
  if (frameInfo.gradient) {
    const grad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
    grad.addColorStop(0, frameInfo.gradient[0]);
    grad.addColorStop(1, frameInfo.gradient[1]);
    ctx.strokeStyle = grad;
  }
  
  ctx.stroke();
  ctx.restore();

  if (avatar) {
    drawCircularImage(ctx, avatar, avatarX, avatarY, avatarSize);
  }

  // 3. User Info
  ctx.textAlign = "center";
  
  // Username
  ctx.fillStyle = "#ffcc00"; // Golden color for name as in reference
  ctx.font = "bold 28px Sans";
  ctx.fillText(data.username || "Unknown", width / 2, 280);

  // Role/Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px Sans";
  ctx.fillText(`(${data.role || "Moon Citizen"})`, width / 2, 310);

  // Rank and Level
  ctx.font = "22px Sans";
  ctx.fillText(`Rank ${data.rank || 0} Level ${data.level || 1}`, width / 2, 345);

  // 4. XP Bar
  const barWidth = 300;
  const barHeight = 20;
  const barX = (width - barWidth) / 2;
  const barY = 365;
  
  // Bar background
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 10);
  ctx.fill();
  
  // Bar progress
  const progress = Math.min((data.xp || 0) / (data.xpTarget || 100), 1);
  ctx.fillStyle = "#3498db"; // Blue progress bar
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth * progress, barHeight, 10);
  ctx.fill();
  
  // XP Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "14px Sans";
  ctx.fillText(`${data.xp || 0} / ${data.xpTarget || 100} XP`, width / 2, barY + 15);

  // 5. Economy (Top Left)
  ctx.textAlign = "left";
  ctx.font = "16px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`Bank: ${data.bank?.toLocaleString() || 0}`, 20, 30);
  ctx.fillText(`Wallet: ${data.wallet?.toLocaleString() || 0}`, 20, 55);

  // 6. Footer
  ctx.textAlign = "center";
  ctx.font = "bold 16px Sans";
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillText("𝕋𝔼ℕ𝕊𝕌𝔽𝔸 - Family", width / 2, 480);

  return canvas.toBuffer();
}

module.exports = { generateProfileImage };
