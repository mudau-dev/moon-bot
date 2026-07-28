const { createCanvas, loadImage } = require("canvas");

async function loadImageSafe(url) {
    if (!url) return null;
    try {
        return await loadImage(url);
    } catch (err) {
        return null;
    }
}

// Utility to draw a rounded rectangle in a compatible way (works even if ctx.roundRect isn't available)
function drawRoundedRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        radius = Object.assign({ tl: 0, tr: 0, br: 0, bl: 0 }, radius);
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
}

async function generatePCImage(data) {
    const width = 1200;
    const height = 675;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background: White
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Royal Header (Top Center)
    ctx.fillStyle = "#1a1a2e"; // Dark blue for text
    ctx.font = "bold 50px 'Times New Roman'"; // Royal font
    ctx.textAlign = "center";
    ctx.fillText("┃ ꕥ 𝚳OO𝚴𝐋𝚰𝐆𝚮𝚻 彡 ★", width / 2, 60);

    // Section Title
    ctx.font = "bold 40px Arial";
    ctx.fillText("YOUR POKÉMON PC", width / 2, 120);

    // Reset text alignment to left for slot content
    ctx.textAlign = "left";

    const pokemons = data.pokemons || [];

    // PC Slots (Grid layout, 4 columns)
    const startX = 50;
    const startY = 160;
    const slotWidth = 250;
    const slotHeight = 100;
    const colSpacing = 20;
    const rowSpacing = 20;
    const cols = 4;

    for (let i = 0; i < pokemons.length; i++) {
        const poke = pokemons[i];
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = startX + (col * (slotWidth + colSpacing));
        const y = startY + (row * (slotHeight + rowSpacing));

        // Slot Background
        ctx.fillStyle = "#f0f0f0"; // Light grey
        drawRoundedRect(ctx, x, y, slotWidth, slotHeight, 10);
        ctx.fill();

        ctx.strokeStyle = "#1a1a2e"; // Dark border
        ctx.lineWidth = 2;
        ctx.stroke();

        if (poke) {
            // Poke Sprite (Thumbnail) - try several common fields for the dex number
            const dexNum = poke.pokedexNumber ?? poke.dex ?? poke.id ?? poke.number;
            const spriteUrl = dexNum
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNum}.png`
                : null;

            const sprite = await loadImageSafe(spriteUrl);
            if (sprite) {
                ctx.drawImage(sprite, x + 5, y + 15, 70, 70);
            }

            // Name & Level
            ctx.fillStyle = "#1a1a2e";
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "left";
            ctx.fillText((poke.nickname || poke.name || "Unknown").toString().toUpperCase(), x + 85, y + 40);
            ctx.font = "16px Arial";
            ctx.fillText(`Lv.${poke.level ?? 1}`, x + 85, y + 65);

            // HP Bar Background
            ctx.fillStyle = "#cccccc";
            ctx.fillRect(x + 85, y + 75, 150, 8);

            // HP calculation (support 0 hp properly)
            const hp = poke.hp ?? poke.maxHp ?? 100;
            const maxHp = poke.maxHp ?? poke.hp ?? 100;
            const hpPercent = Math.max(0, Math.min(1, hp / maxHp));
            ctx.fillStyle = hpPercent > 0.5 ? "#4cd964" : hpPercent > 0.2 ? "#f39c12" : "#e74c3c";
            ctx.fillRect(x + 85, y + 75, 150 * hpPercent, 8);

            // HP Text
            ctx.fillStyle = "#1a1a2e";
            ctx.font = "14px Arial";
            ctx.textAlign = "right";
            ctx.fillText(`${Math.ceil(hp)} / ${maxHp}`, x + 235, y + 90);
            ctx.textAlign = "left";
        }
    }

    // Bottom Border
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, height - 20, width, 20);

    return canvas.toBuffer();
}

module.exports = { generatePCImage };