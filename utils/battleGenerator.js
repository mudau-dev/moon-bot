// ⚠️⚠️⚠️ do to some things i know that kelin is going to come and try to steal this code i here by kairu stop kelin from doing it 🌚🌚🌚

const { createCanvas, loadImage } = require('canvas');

async function generateBattleImage(data) {
    const width = 800;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw Background based on weather
    ctx.fillStyle = '#78C850'; // Default Grass
    if (data.weather === 'Rain') ctx.fillStyle = '#6890F0';
    if (data.weather === 'Sunny') ctx.fillStyle = '#F08030';
    if (data.weather === 'Snow') ctx.fillStyle = '#98D8D8';
    if (data.weather === 'Sandstorm') ctx.fillStyle = '#E0C068';
    ctx.fillRect(0, 0, width, height);

    // Draw Platforms
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(200, 400, 150, 50, 0, 0, Math.PI * 2); // Player platform
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(600, 200, 120, 40, 0, 0, Math.PI * 2); // Opponent platform
    ctx.fill();

    // Load Sprites
    try {
        const playerSprite = await loadImage(data.player.sprite);
        const opponentSprite = await loadImage(data.opponent.sprite);

        // Draw Opponent (Top Right)
        ctx.drawImage(opponentSprite, 500, 50, 200, 200);

        // Draw Player (Bottom Left)
        ctx.drawImage(playerSprite, 100, 250, 250, 250);
    } catch (err) {
        console.error("Sprite Load Error:", err);
    }

    // Draw Dropped Item (Center)
    if (data.droppedItem) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(400, 250, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(data.droppedItem.icon || '🎁', 400, 250);
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(data.droppedItem.type, 400, 305);
    }

    // Draw HUDs
    drawHUD(ctx, 50, 50, data.player, true);
    drawHUD(ctx, 450, 300, data.opponent, false);

    // Draw Narration Box
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 420, width, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(data.lastAction || 'Waiting for moves...', width / 2, 465);

    // Draw Weather Icon
    if (data.weather !== 'Clear') {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Weather: ${data.weather}`, 780, 30);
    }

    return canvas.toBuffer();
}

function drawHUD(ctx, x, y, poke, isPlayer) {
    const w = 300;
    const h = 100;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${poke.name} Lv.${poke.level}`, x + 15, y + 25);

    // HP Bar
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x + 15, y + 40, 270, 15);
    const hpPercent = Math.max(0, poke.hp / poke.maxHp);
    ctx.fillStyle = hpPercent > 0.5 ? '#78C850' : hpPercent > 0.2 ? '#F08030' : '#F03030';
    ctx.fillRect(x + 15, y + 40, 270 * hpPercent, 15);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText(`HP: ${Math.ceil(poke.hp)}/${poke.maxHp}`, x + 15, y + 70);

    // Energy Bar
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x + 15, y + 75, 270, 8);
    const energyPercent = Math.max(0, poke.energy / 100);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(x + 15, y + 75, 270 * energyPercent, 8);
}

module.exports = { generateBattleImage };
