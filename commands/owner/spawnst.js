const { isTrueOwner } = require("../../database/users");
const SanctumSpawn = require("../../models/SanctumSpawn");
const { getDynamicImage } = require("../santum/_shared");

moon({
    name: "spawnst",
    description: "Spawn a wild beast (Owner Only)",
    category: "owner",

    async execute(sock, jid, sender, args, m, { replyWithImage, reply }) {
        try {
            if (!(await isTrueOwner(sender))) {
                return reply("❌ Only True Owner can use this.");
            }

            const speciesList = ["Moonfang", "Voidshade", "Sunwing", "Deepscale"];
            const elementList = ["Dark", "Fire", "Water", "Light"];
            const rarityList = ["Common", "Rare", "Epic", "Legendary"];

            const species = speciesList[Math.floor(Math.random() * speciesList.length)];
            const element = elementList[Math.floor(Math.random() * elementList.length)];
            const rarity = rarityList[Math.floor(Math.random() * rarityList.length)];

            const level = Math.floor(Math.random() * 20) + 5;
            const image = getDynamicImage(species, element);

            const power = level * (rarity === "Legendary" ? 3 : rarity === "Epic" ? 2 : 1);

            await SanctumSpawn.findOneAndUpdate(
                { groupId: jid },
                {
                    groupId: jid,
                    spawnEnabled: true,
                    activeSpawn: {
                        name: species,
                        level,
                        rarity,
                        element,
                        image,
                        spawnedAt: new Date()
                    }
                },
                { upsert: true, new: true }
            );

            const text =
`🌲 WILD BEAST APPEARED

👾 *Name:* ${species}
🔥 *Element:* ${element}
⭐ *Rarity:* ${rarity}
📊 *Level:* ${level}
⚡ *Power:* ${power}

🎯 *Action:*
• \`.catch\` → encounter
• \`.capture\` → attempt capture`;

            return replyWithImage(image, text);

        } catch (err) {
            console.error("SPAWN ERROR:", err);
            return reply(`❌ Spawn failed: ${err.message || "unknown error"}`);
        }
    }
});