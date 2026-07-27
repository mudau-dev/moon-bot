const { createCanvas, loadImage } = require("canvas");

/**
 * Safe image loader
 */
async function loadImageSafe(url) {
  try {
    if (!url) return null;
    return await loadImage(url);
  } catch (e) {
    console.error("Image load failed:", url, e.message);
    return null;
  }
}

/**
 * Premium Guild Image Generator
 */
async function generateGuildProfile(guild, user) {
  try {
    const width = 800;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. BACKGROUND (Guild Icon)
    const guildBgUrl = guild.icon || "https://i.ibb.co/L50k8fW/haven-festival.jpg";
    const bg = await loadImageSafe(guildBgUrl);
    
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
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);
    }

    // 2. SEMI-TRANSPARENT OVERLAY (Bottom section)
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 500, width, 300);

    // 3. PROFILE BOX (User Profile Pic)
    const profilePicUrl = user.profilePic || "https://i.ibb.co/L50k8fW/haven-festival.jpg";
    const profile = await loadImageSafe(profilePicUrl);
    
    const px = 50;
    const py = 300;
    const pSize = 350;
    const pRadius = 50;

    // Shadow for the box
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 30;
    
    // Draw rounded box for profile
    ctx.beginPath();
    ctx.moveTo(px + pRadius, py);
    ctx.lineTo(px + pSize - pRadius, py);
    ctx.quadraticCurveTo(px + pSize, py, px + pSize, py + pRadius);
    ctx.lineTo(px + pSize, py + pSize - pRadius);
    ctx.quadraticCurveTo(px + pSize, py + pSize, px + pSize - pRadius, py + pSize);
    ctx.lineTo(px + pRadius, py + pSize);
    ctx.quadraticCurveTo(px, py + pSize, px, py + pSize - pRadius);
    ctx.lineTo(px, py + pRadius);
    ctx.quadraticCurveTo(px, py, px + pRadius, py);
    ctx.closePath();
    
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.restore();

    // Clip and draw profile image
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px + pRadius, py);
    ctx.lineTo(px + pSize - pRadius, py);
    ctx.quadraticCurveTo(px + pSize, py, px + pSize, py + pRadius);
    ctx.lineTo(px + pSize, py + pSize - pRadius);
    ctx.quadraticCurveTo(px + pSize, py + pSize, px + pSize - pRadius, py + pSize);
    ctx.lineTo(px + pRadius, py + pSize);
    ctx.quadraticCurveTo(px, py + pSize, px, py + pSize - pRadius);
    ctx.lineTo(px, py + pRadius);
    ctx.quadraticCurveTo(px, py, px + pRadius, py);
    ctx.closePath();
    ctx.clip();
    
    if (profile) {
      // Cover logic for profile pic
      const pAspect = profile.width / profile.height;
      let pdw, pdh, pdx, pdy;
      if (pAspect > 1) {
        pdh = pSize;
        pdw = pdh * pAspect;
        pdx = px + (pSize - pdw) / 2;
        pdy = py;
      } else {
        pdw = pSize;
        pdh = pdw / pAspect;
        pdx = px;
        pdy = py + (pSize - pdh) / 2;
      }
      ctx.drawImage(profile, pdx, pdy, pdw, pdh);
    }
    ctx.restore();

    // 4. TEXTS
    
    // Guild Name (White)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 70px Sans";
    ctx.textAlign = "left";
    ctx.fillText((guild.name || "Unknown").toUpperCase(), 50, 710);

    // Owner Name (Cyan)
    ctx.fillStyle = "#00ffff";
    ctx.font = "italic 45px Sans";
    ctx.fillText(user.name || "Unknown", 50, 780);

    // Footer Corner
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "24px Sans";
    ctx.textAlign = "right";
    ctx.fillText("Moonlight Haven - Guilds", 780, 780);

    return { buffer: canvas.toBuffer("image/png") };
  } catch (err) {
    console.error("GUILD GEN ERROR:", err);
    const c = createCanvas(100, 100);
    return { buffer: c.toBuffer("image/png") };
  }
}

module.exports = { generateGuildProfile };
