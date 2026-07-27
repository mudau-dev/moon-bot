const { createCanvas, loadImage } = require("canvas");

async function loadImageSafe(url) {
    if (!url) return null;
    try {
        return await loadImage(url);
    } catch (err) {
        return null;
    }
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

    const pokemons = data.pokemons || [];
    const selectedIdx = data.selectedIdx || -1; // -1 for no specific selection in overview

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
        ctx.beginPath();
        ctx.roundRect(x, y, 500, slotHeight, 10);
        ctx.fill();

        ctx.strokeStyle = "#1a1a2e"; // Dark border
        ctx.lineWidth = 2;
        ctx.stroke();

        if (poke) {
            // Poke Sprite (Thumbnail)
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.pokedexNumber}.png`;
            const sprite = await loadImageSafe(spriteUrl);
            if (sprite) {
                ctx.drawImage(sprite, x + 10, y + 5, 70, 70);
            }

            // Name & Level
            ctx.fillStyle = isSelected ? "#ffffff" : "#1a1a2e";
            ctx.font = "bold 26px Arial";
            ctx.fillText((poke.nickname || poke.name).toUpperCase(), x + 90, y + 35);
            ctx.font = "20px Arial";
            ctx.fillText(`Lv.${poke.level || 1}`, x + 90, y + 60);

            // HP Bar Background
            ctx.fillStyle = isSelected ? "#444444" : "#cccccc";
            ctx.fillRect(x + 250, y + 25, 230, 10);

            // HP Bar Fill
            const hpPercent = Math.max(0, (poke.hp || 100) / (poke.maxHp || 100));
            ctx.fillStyle = hpPercent > 0.5 ? "#4cd964" : hpPercent > 0.2 ? "#f39c12" : "#e74c3c";
            ctx.fillRect(x + 250, y + 25, 230 * hpPercent, 10);

            // HP Text
            ctx.fillStyle = isSelected ? "#ffffff" : "#1a1a2e";
            ctx.font = "18px Arial";
            ctx.textAlign = "right";
            ctx.fillText(`${Math.ceil(poke.hp || 100)} / ${poke.maxHp || 100}`, x + 480, y + 50);
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
