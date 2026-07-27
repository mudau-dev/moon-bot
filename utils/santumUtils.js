const { createCanvas, loadImage } = require("canvas");

async function generateSantumCard(beast) {
    const width = 800;
    const height = 1100;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background: Dark Mystery
    const bgGrad = ctx.createRadialGradient(400, 550, 100, 400, 550, 800);
    bgGrad.addColorStop(0, "#1a1a2e");
    bgGrad.addColorStop(1, "#000000");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Load Beast Image
    try {
        const img = await loadImage(beast.image);
        const scale = Math.max(width / img.width, height / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const drawX = (width - drawW) / 2;
        const drawY = (height - drawH) / 2;
        ctx.globalAlpha = 0.7;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.globalAlpha = 1.0;
    } catch (e) {
        ctx.fillStyle = "#333";
        ctx.fillRect(50, 150, 700, 700);
    }

    // Royal Frame
    ctx.strokeStyle = "#00d2ff";
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // Header Banner
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, width, 140);
    
    // Beast Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px 'Times New Roman'";
    ctx.textAlign = "center";
    ctx.fillText(beast.speciesName.toUpperCase(), width / 2, 80);
    
    ctx.font = "25px Arial";
    ctx.fillStyle = "#00d2ff";
    ctx.fillText("SANTUM BEAST • KEEPER'S PRIDE", width / 2, 120);

    // Stats Section (Bottom)
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, height - 250, width, 250);
    
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Arial";
    ctx.fillText(`LV. ${beast.level}`, 50, height - 190);
    ctx.fillText(`HP: ${beast.hp}/${beast.maxHp}`, 50, height - 140);
    ctx.fillText(`ELEMENT: ${beast.element}`, 50, height - 90);
    
    ctx.textAlign = "right";
    ctx.fillText(`RARITY: ${beast.rarity}`, width - 50, height - 190);
    ctx.fillText(`SN: #${beast.serialNumber}`, width - 50, height - 140);
    ctx.fillText(`NATURE: ${beast.nature}`, width - 50, height - 90);

    // Footer
    ctx.textAlign = "center";
    ctx.font = "bold 25px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("•• MOONLIGHT SANCTUM ••", width / 2, height - 30);

    return canvas.toBuffer();
}

module.exports = { generateSantumCard };
