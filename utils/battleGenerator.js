const { createCanvas, loadImage } = require('canvas');

const WEATHER_COLORS = {
  Clear: ['#18243f', '#476a94'],
  Rain: ['#10213f', '#32668f'],
  Sunny: ['#3b2044', '#bf6a44'],
  Snow: ['#172b44', '#6f9fba'],
  Sandstorm: ['#3d2f24', '#99744b'],
  Fog: ['#1d2937', '#637382'],
  Storm: ['#221941', '#57406e'],
};

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || 'The battle continues…').split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  lines.slice(0, maxLines).forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
}

function hpColor(ratio) {
  if (ratio > 0.5) return '#4ade80';
  if (ratio > 0.2) return '#fbbf24';
  return '#fb7185';
}

function drawHud(ctx, x, y, pokemon, align = 'left') {
  const width = 330;
  const height = 108;
  const currentHp = Math.max(0, Number(pokemon.hp) || 0);
  const maxHp = Math.max(1, Number(pokemon.maxHp) || currentHp || 1);
  const hpRatio = Math.min(1, currentHp / maxHp);
  const energyRatio = Math.max(0, Math.min(1, Number(pokemon.energy ?? 100) / 100));

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = 'rgba(9, 14, 27, 0.87)';
  roundRect(ctx, x, y, width, height, 16);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = align;
  const textX = align === 'left' ? x + 18 : x + width - 18;
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px Sans';
  ctx.fillText(String(pokemon.nickname || pokemon.name || 'Pokémon').toUpperCase(), textX, y + 29);
  ctx.fillStyle = '#c4b5fd';
  ctx.font = 'bold 13px Sans';
  ctx.fillText(`LV. ${pokemon.level || 1}`, textX, y + 49);

  const barX = x + 18;
  const barWidth = width - 36;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, barX, y + 61, barWidth, 13, 7);
  ctx.fill();
  ctx.fillStyle = hpColor(hpRatio);
  roundRect(ctx, barX, y + 61, Math.max(4, barWidth * hpRatio), 13, 7);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '12px Sans';
  ctx.textAlign = 'left';
  ctx.fillText(`HP ${Math.ceil(currentHp)} / ${Math.ceil(maxHp)}`, barX, y + 91);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, barX + 175, y + 82, 119, 7, 4);
  ctx.fill();
  ctx.fillStyle = '#60a5fa';
  roundRect(ctx, barX + 175, y + 82, Math.max(3, 119 * energyRatio), 7, 4);
  ctx.fill();
  ctx.restore();
}

async function drawPokemon(ctx, spriteUrl, x, y, width, height, flip = false) {
  if (!spriteUrl) return;
  try {
    const sprite = await loadImage(spriteUrl);
    ctx.save();
    if (flip) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, width, height);
    } else {
      ctx.drawImage(sprite, x, y, width, height);
    }
    ctx.restore();
  } catch (error) {
    console.warn('[BATTLE SPRITE]', error.message);
  }
}

async function generateBattleImage(data) {
  const width = 900;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const [top, bottom] = WEATHER_COLORS[data.weather] || WEATHER_COLORS.Clear;

  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, top);
  background.addColorStop(1, bottom);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const moonGlow = ctx.createRadialGradient(760, 80, 15, 760, 80, 160);
  moonGlow.addColorStop(0, 'rgba(255,255,255,0.74)');
  moonGlow.addColorStop(0.35, 'rgba(196,181,253,0.26)');
  moonGlow.addColorStop(1, 'rgba(196,181,253,0)');
  ctx.fillStyle = moonGlow;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(760, 80, 35, 0, Math.PI * 2);
  ctx.fill();

  for (let index = 0; index < 38; index += 1) {
    const x = (index * 97) % width;
    const y = 35 + ((index * 53) % 280);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const floor = ctx.createLinearGradient(0, 330, 0, 520);
  floor.addColorStop(0, 'rgba(8, 14, 28, 0.05)');
  floor.addColorStop(1, 'rgba(5, 8, 18, 0.72)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 300, width, 220);

  ctx.fillStyle = 'rgba(6, 10, 21, 0.36)';
  ctx.beginPath();
  ctx.ellipse(215, 420, 175, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(690, 276, 145, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  await drawPokemon(ctx, data.player?.sprite, 78, 244, 280, 280, false);
  await drawPokemon(ctx, data.opponent?.sprite, 550, 73, 240, 240, true);

  drawHud(ctx, 34, 40, data.player || {}, 'left');
  drawHud(ctx, 536, 332, data.opponent || {}, 'right');

  if (data.droppedItem) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    roundRect(ctx, 392, 250, 116, 92, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250,204,21,0.65)';
    ctx.stroke();
    ctx.font = '32px Sans';
    ctx.textAlign = 'center';
    ctx.fillText(data.droppedItem.icon || '🎁', 450, 285);
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 11px Sans';
    drawWrappedText(ctx, data.droppedItem.type || 'Item', 450, 307, 95, 13, 2);
  }

  ctx.fillStyle = 'rgba(6, 10, 20, 0.9)';
  roundRect(ctx, 28, 510, 844, 66, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(196,181,253,0.33)';
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 16px Sans';
  ctx.textAlign = 'center';
  drawWrappedText(ctx, data.lastAction, 450, 535, 790, 19, 2);

  ctx.textAlign = 'left';
  ctx.font = 'bold 12px Sans';
  ctx.fillStyle = '#ddd6fe';
  ctx.fillText(`MOONLIGHT HAVEN ARENA • ${String(data.weather || 'Clear').toUpperCase()} WEATHER`, 36, 24);

  return canvas.toBuffer('image/png');
}

module.exports = { generateBattleImage };
