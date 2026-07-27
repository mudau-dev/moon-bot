const { createCanvas, loadImage } = require("canvas");

async function loadImageSafe(url) {
  try {
    if (!url) return null;
    return await loadImage(url);
  } catch {
    return null;
  }
}

function roundRect(ctx, x, y, w, h, r) {
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

async function generateProfileImage(data) {
  const width = 800;
  const height = 800;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  const bg = await loadImageSafe(data.backgroundImage || "https://i.ibb.co/L50k8fW/haven-festival.jpg");
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

  // Modern Glassmorphism Overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, width, height);
  
  // Content Box
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  roundRect(ctx, 40, 40, 720, 720, 30);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Square Avatar (Corner)
  const avatarSize = 220;
  const avatarX = 70;
  const avatarY = 70;
  const avatar = await loadImageSafe(data.profileImage || "https://ui-avatars.com/api/?name=User");
  
  if (avatar) {
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  }
  
  // Aesthetic Border for Avatar
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 8;
  ctx.strokeRect(avatarX, avatarY, avatarSize, avatarSize);
  
  // Inner white border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(avatarX - 5, avatarY - 5, avatarSize + 10, avatarSize + 10);

  // User Info - Modern Typography
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 60px Sans";
  ctx.textAlign = "left";
  ctx.fillText(data.username.toUpperCase(), 320, 130);

  // Role Badge
  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 35px Sans";
  ctx.fillText(data.role.toUpperCase(), 320, 185);

  // Stats Section
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  roundRect(ctx, 70, 320, 660, 320, 20);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Sans";
  ctx.fillText("LVL", 100, 370);
  ctx.fillText(data.level.toString(), 200, 370);
  
  ctx.fillText("XP", 100, 420);
  ctx.fillText(`${data.xp} / ${data.xpTarget}`, 200, 420);

  // Progress Bar
  const barX = 100;
  const barY = 440;
  const barWidth = 600;
  const barHeight = 15;
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  roundRect(ctx, barX, barY, barWidth, barHeight, 7);
  ctx.fill();
  
  ctx.fillStyle = "#00ffff";
  const progress = Math.min(data.xp / data.xpTarget, 1);
  roundRect(ctx, barX, barY, barWidth * progress, barHeight, 7);
  ctx.fill();

  // Economy
  ctx.fillStyle = "#ffcc00";
  ctx.font = "bold 35px Sans";
  ctx.fillText("WALLET", 100, 520);
  ctx.textAlign = "right";
  ctx.fillText(data.wallet.toLocaleString(), 700, 520);
  
  ctx.textAlign = "left";
  ctx.fillText("BANK", 100, 580);
  ctx.textAlign = "right";
  ctx.fillText(data.bank.toLocaleString(), 700, 580);

  
 
  // Footer
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font = "bold 20px Sans";
  ctx.fillText("𝕄𝕆𝕆ℕ𝕃𝕀𝔾ℍ𝕋 ℍ𝔸𝕍𝔼ℕ • ℙℝ𝕆𝔽𝕀𝕃𝔼", width / 2, 760);

  return canvas.toBuffer();
}

module.exports = { generateProfileImage };