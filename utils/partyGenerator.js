const { createCanvas, loadImage } = require("canvas");

// Type color map matching the reference image
const TYPE_COLORS = {
  grass:    { bg: "#2d6a2d", text: "#7fff7f" },
  fire:     { bg: "#8b2500", text: "#ff9966" },
  water:    { bg: "#1a4d8a", text: "#66b3ff" },
  electric: { bg: "#7a6a00", text: "#ffe066" },
  ice:      { bg: "#1a5c6e", text: "#aaf0ff" },
  fighting: { bg: "#7a2000", text: "#ff8866" },
  poison:   { bg: "#5a1a7a", text: "#cc88ff" },
  ground:   { bg: "#7a5a00", text: "#ffcc66" },
  flying:   { bg: "#2a3a6e", text: "#99aaff" },
  psychic:  { bg: "#7a0055", text: "#ff66cc" },
  bug:      { bg: "#3a5a00", text: "#aadd44" },
  rock:     { bg: "#5a4a2a", text: "#ccaa77" },
  ghost:    { bg: "#2a1a4e", text: "#9977dd" },
  dragon:   { bg: "#1a1a7a", text: "#6677ff" },
  dark:     { bg: "#2a1a1a", text: "#998877" },
  steel:    { bg: "#3a3a5a", text: "#aabbcc" },
  fairy:    { bg: "#7a2a5a", text: "#ffaacc" },
  normal:   { bg: "#4a4a4a", text: "#cccccc" },
};

function getTypeColor(type) {
  return TYPE_COLORS[(type || "normal").toLowerCase()] || TYPE_COLORS.normal;
}

async function loadImageSafe(url) {
  if (!url) return null;
  try {
    return await loadImage(url);
  } catch {
    return null;
  }
}

function drawRoundedRect(ctx, x, y, w, h, r) {
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

async function generatePartyImage({ pokemons = [], trainerName = "Trainer" }) {
  const W = 1000, H = 660;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, W, H);

  // Subtle gradient overlay
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "rgba(30,20,60,0.7)");
  bg.addColorStop(1, "rgba(10,20,40,0.7)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Header ──────────────────────────────────────────────────────────────────
  // Left accent bar
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(20, 18, 5, 36);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Sans";
  ctx.textAlign = "left";
  ctx.fillText("PARTY", 34, 48);

  ctx.fillStyle = "#6b7280";
  ctx.font = "bold 32px Sans";
  ctx.fillText("//", 120, 48);

  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 32px Sans";
  ctx.fillText("ACTIVE", 148, 48);

  // Trainer name (top right)
  ctx.fillStyle = "#9ca3af";
  ctx.font = "13px Sans";
  ctx.textAlign = "right";
  ctx.fillText("TRAINER: " + trainerName.toUpperCase(), W - 20, 38);

  // Header divider line
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 62);
  ctx.lineTo(W - 20, 62);
  ctx.stroke();

  // ── Grid: 2 columns × 3 rows ─────────────────────────────────────────────
  const CARD_W = 460, CARD_H = 170;
  const GAP_X = 20, GAP_Y = 14;
  const START_X = 20, START_Y = 76;

  // Left-side accent colors per row
  const ROW_ACCENTS = ["#22c55e", "#3b82f6", "#f59e0b"];

  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = START_X + col * (CARD_W + GAP_X);
    const y = START_Y + row * (CARD_H + GAP_Y);
    const poke = pokemons[i];

    // Card background
    ctx.fillStyle = "rgba(28, 36, 48, 0.92)";
    drawRoundedRect(ctx, x, y, CARD_W, CARD_H, 12);
    ctx.fill();

    // Left accent stripe
    ctx.fillStyle = ROW_ACCENTS[row];
    ctx.fillRect(x, y + 12, 4, CARD_H - 24);

    if (poke) {
      // ── Sprite ────────────────────────────────────────────────────────────
      const dexNum = poke.pokedexNumber;
      const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNum}.png`;
      const sprite = await loadImageSafe(spriteUrl);
      if (sprite) {
        ctx.drawImage(sprite, x + 8, y + 10, 140, 140);
      } else {
        // Placeholder circle
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.arc(x + 78, y + 80, 60, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Name + Level ──────────────────────────────────────────────────────
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Sans";
      const name = (poke.nickname || poke.name || "???").toUpperCase();
      ctx.fillText(name, x + 158, y + 38);

      // Status badge (e.g. BRN, PSN)
      if (poke.status && poke.status !== "Healthy") {
        const statusColors = { BRN: "#c2410c", PSN: "#7c3aed", PAR: "#b45309", FRZ: "#0891b2", SLP: "#374151" };
        const sc = statusColors[poke.status.toUpperCase().slice(0,3)] || "#374151";
        const statusLabel = poke.status.toUpperCase().slice(0, 3);
        const sw = ctx.measureText(statusLabel).width + 12;
        ctx.fillStyle = sc;
        drawRoundedRect(ctx, x + 158 + ctx.measureText(name).width + 8, y + 20, sw, 22, 4);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Sans";
        ctx.fillText(statusLabel, x + 158 + ctx.measureText(name).width + 14, y + 35);
        ctx.font = "bold 22px Sans";
      }

      // Level badge (top right of card)
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      drawRoundedRect(ctx, x + CARD_W - 60, y + 12, 52, 24, 6);
      ctx.fill();
      ctx.fillStyle = "#d1d5db";
      ctx.font = "bold 13px Sans";
      ctx.textAlign = "right";
      ctx.fillText("Lv" + poke.level, x + CARD_W - 14, y + 29);

      // ── Type badges ───────────────────────────────────────────────────────
      const types = [poke.type1, poke.type2].filter(Boolean);
      let tx = x + 158;
      for (const type of types) {
        const tc = getTypeColor(type);
        const label = type.toUpperCase();
        ctx.font = "bold 11px Sans";
        const tw = ctx.measureText(label).width + 16;
        ctx.fillStyle = tc.bg;
        drawRoundedRect(ctx, tx, y + 50, tw, 20, 4);
        ctx.fill();
        ctx.fillStyle = tc.text;
        ctx.textAlign = "left";
        ctx.fillText(label, tx + 8, y + 64);
        tx += tw + 8;
      }

      // ── HP Bar ────────────────────────────────────────────────────────────
      const maxHp = poke.maxHp || poke.hp || 1;
      const curHp = Math.max(0, Math.ceil(poke.hp));
      const hpRatio = Math.min(curHp / maxHp, 1);

      ctx.fillStyle = "#374151";
      ctx.font = "12px Sans";
      ctx.textAlign = "left";
      ctx.fillText("HP", x + 158, y + 100);

      const barX = x + 182, barY = y + 89, barW = CARD_W - 200, barH = 10;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      drawRoundedRect(ctx, barX, barY, barW, barH, 5);
      ctx.fill();

      const hpColor = hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.2 ? "#f59e0b" : "#ef4444";
      ctx.fillStyle = hpColor;
      drawRoundedRect(ctx, barX, barY, Math.max(barW * hpRatio, 4), barH, 5);
      ctx.fill();

      // HP numbers
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "bold 13px Sans";
      ctx.textAlign = "right";
      ctx.fillText(`${curHp} / ${maxHp}`, x + CARD_W - 10, y + 99);

    } else {
      // Empty slot
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.font = "italic 16px Sans";
      ctx.textAlign = "center";
      ctx.fillText("empty slot", x + CARD_W / 2, y + CARD_H / 2 + 6);
    }
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "12px Sans";
  ctx.textAlign = "center";
  ctx.fillText("𝕄𝕆𝕆ℕ𝕃𝕀𝔾ℍ𝕋 ℍ𝔸𝕍𝔼ℕ • POKÉMON", W / 2, H - 10);

  return canvas.toBuffer();
}

module.exports = { generatePartyImage };
