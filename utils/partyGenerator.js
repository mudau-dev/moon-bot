const { createCanvas, loadImage } = require("canvas");

async function loadImageSafe(url) {
    if (!url) return null;
    try {
        return await loadImage(url);
    } catch (err) {
        return null;
    }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

async function generatePartyImage(data) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#0f172a"; // Dark blue-black
    ctx.fillRect(0, 0, width, height);
    
    // Add some texture/gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "rgba(167, 139, 250, 0.1)"); // moonviolet
    grad.addColorStop(1, "rgba(6, 182, 212, 0.1)"); // cyan
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Sans";
    ctx.textAlign = "center";
    ctx.fillText("// POKÉMON - PARTY", width / 2, 60);
    
    ctx.strokeStyle = "rgba(167, 139, 250, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 80);
    ctx.lineTo(700, 80);
    ctx.stroke();

    const pokemons = data.pokemons || [];
    
    // Grid layout for 6 pokemons
    const startX = 50;
    const startY = 120;
    const itemWidth = 340;
    const itemHeight = 130;
    const spacing = 20;

    for (let i = 0; i < 6; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = startX + col * (itemWidth + spacing);
        const y = startY + row * (itemHeight + spacing);
        
        const poke = pokemons[i];
        
        // Card background
        ctx.fillStyle = "rgba(30, 41, 59, 0.8)";
        drawRoundedRect(ctx, x, y, itemWidth, itemHeight, 15);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.stroke();

        if (poke) {
            // Poke Sprite
            const dexNum = poke.pokedexNumber;
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNum}.png`;
            const sprite = await loadImageSafe(spriteUrl);
            if (sprite) {
                ctx.drawImage(sprite, x + 10, y + 10, 110, 110);
            }

            // Info
            ctx.textAlign = "left";
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px Sans";
            ctx.fillText((poke.nickname || poke.name).toUpperCase(), x + 130, y + 40);
            
            ctx.fillStyle = "#94a3b8";
            ctx.font = "16px Sans";
            ctx.fillText(`Lv. ${poke.level}`, x + 130, y + 65);
            
            // HP Bar
            const barWidth = 180;
            const barHeight = 10;
            const barX = x + 130;
            const barY = y + 85;
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 5);
            ctx.fill();
            
            const hpRatio = Math.min(poke.hp / (poke.maxHp || poke.hp), 1);
            ctx.fillStyle = hpRatio > 0.5 ? "#10b981" : hpRatio > 0.2 ? "#fbbf24" : "#f43f5e";
            drawRoundedRect(ctx, barX, barY, barWidth * hpRatio, barHeight, 5);
            ctx.fill();
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "12px Sans";
            ctx.fillText(`${Math.ceil(poke.hp)} / ${poke.maxHp || Math.ceil(poke.hp)}`, barX + barWidth - 50, barY - 5);
            
        } else {
            // Empty Slot
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.font = "italic 20px Sans";
            ctx.textAlign = "center";
            ctx.fillText("empty slot", x + itemWidth / 2, y + itemHeight / 2 + 10);
        }
    }

    // Footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "14px Sans";
    ctx.textAlign = "center";
    ctx.fillText("𝕄𝕆𝕆ℕ𝕃𝕀𝔾ℍ𝕋 ℍ𝔸𝕍𝔼ℕ • POKÉMON", width / 2, 580);

    return canvas.toBuffer();
}

module.exports = { generatePartyImage };
