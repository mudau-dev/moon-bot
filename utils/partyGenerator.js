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

async function generatePartyImage(data) {
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
    ctx.fillText("YOUR POKÉMON PARTY", width / 2, 120);

    // Reset alignment for the main column
    ctx.textAlign = "left";

    const pokemons = data.pokemons || [];
    const selectedIdx = data.selectedIdx ?? -1; // -1 for no specific selection in overview

    // Draw Party Slots (Centered, single column)
    const startX = (width - 500) / 2; // Center the column
    const startY = 160;
    const slotHeight = 80;
    const slotSpacing = 15;

    for (let i = 0; i < 6; i++) {
        const x = startX;
        const y = startY + (i * (slotHeight + slotSpacing));
        const isSelected = i === selectedIdx;
        const poke = pokemons[i];

        // Slot Background
        ctx.fillStyle = isSelected ? "#e94560" : "#f0f0f0"; // Highlight selected, light grey for others
        drawRoundedRect(ctx, x, y, 500, slotHeight, 10);
        ctx.fill();

        ctx.strokeStyle = "#1a1a2e"; // Dark border
        ctx.lineWidth = 2;
        ctx.stroke();

        if (poke) {
            // Poke Sprite (Thumbnail)
            const dexNum = poke.pokedexNumber ?? poke.dex ?? poke.id ?? poke.number;
            const spriteUrl = dexNum
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNum}.png`
                : null;

            const sprite = await loadImageSafe(spriteUrl);
            if (sprite) {
                ctx.drawImage(sprite, x + 10, y + 5, 70, 70);
            }

            // Name & Level
            ctx.fillStyle = isSelected ? "#ffffff" : "#1a1a2e";
            ctx.font = "bold 26px Arial";
            ctx.textAlign = "left";
            ctx.fillText((poke.nickname || poke.name || "Unknown").toString().toUpperCase(), x + 90, y + 35);
            ctx.font = "20px Arial";
            ctx.fillText(`Lv.${poke.level ?? 1}`, x + 90, y + 60);

            // HP Bar Background
            ctx.fillStyle = isSelected ? "#444444" : "#cccccc";
            ctx.fillRect(x + 250, y + 25, 230, 10);

            // HP Bar Fill
            const hp = poke.hp ?? poke.maxHp ?? 100;
            const maxHp = poke.maxHp ?? poke.hp ?? 100;
            const hpPercent = Math.max(0, Math.min(1, hp / maxHp));
            ctx.fillStyle = hpPercent > 0.5 ? "#4cd964" : hpPercent > 0.2 ? "#f39c12" : "#e74c3c";
            ctx.fillRect(x + 250, y + 25, 230 * hpPercent, 10);

            // HP Text
            ctx.fillStyle = isSelected ? "#ffffff" : "#1a1a2e";
            ctx.font = "18px Arial";
            ctx.textAlign = "right";
            ctx.fillText(`${Math.ceil(hp)} / ${maxHp}`, x + 480, y + 50);
            ctx.textAlign = "left";

            // Status
            if (poke.status && poke.status !== "Healthy") {
                ctx.fillStyle = "#e74c3c";
                ctx.font = "bold 16px Arial";
                ctx.fillText(poke.status, x + 250, y + 55);
            }
        } else {
            // Empty Slot
            ctx.fillStyle = "#888888";
            ctx.font = "italic 24px Arial";
            ctx.fillText("Empty Slot", x + 90, y + 45);
        }
    }

    // Bottom Border
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, height - 20, width, 20);

    return canvas.toBuffer();
}

module.exports = { generatePartyImage };