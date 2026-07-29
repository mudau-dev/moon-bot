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

async function generatePCImage(data) {
    const width = 1000;
    const height = 800;
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
    ctx.fillText("POKÉMON PC STORAGE", width / 2, 60);
    
    ctx.strokeStyle = "rgba(167, 139, 250, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 80);
    ctx.lineTo(900, 80);
    ctx.stroke();

    const pokemons = data.pokemons || [];
    
    // Grid layout
    const startX = 40;
    const startY = 110;
    const itemWidth = 180;
    const itemHeight = 160;
    const spacing = 10;
    const cols = 5;

    for (let i = 0; i < 25; i++) { // Show up to 25 per page
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = startX + col * (itemWidth + spacing);
        const y = startY + row * (itemHeight + spacing);
        
        const poke = pokemons[i];
        
        // Card background
        ctx.fillStyle = "rgba(30, 41, 59, 0.8)";
        drawRoundedRect(ctx, x, y, itemWidth, itemHeight, 10);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.stroke();

        if (poke) {
            // Poke Sprite
            const dexNum = poke.pokedexNumber;
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNum}.png`;
            const sprite = await loadImageSafe(spriteUrl);
            if (sprite) {
                ctx.drawImage(sprite, x + 30, y + 10, 120, 120);
            }

            // Info
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px Sans";
            ctx.fillText((poke.nickname || poke.name).toUpperCase(), x + itemWidth / 2, y + 130);
            
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px Sans";
            ctx.fillText(`Lv. ${poke.level}`, x + itemWidth / 2, y + 150);
        } else {
            // Empty Slot
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.font = "12px Sans";
            ctx.textAlign = "center";
            ctx.fillText("EMPTY", x + itemWidth / 2, y + itemHeight / 2 + 5);
        }
    }

    // Footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "14px Sans";
    ctx.textAlign = "center";
    ctx.fillText(`Page ${data.page || 1} • Total: ${data.total || 0} • 𝕄𝕆𝕆ℕ𝕃𝕀𝔾ℍ𝕋 ℍ𝔸𝕍𝔼ℕ`, width / 2, 780);

    return canvas.toBuffer();
}

module.exports = { generatePCImage };
