const { getUser } = require("./_shared");


moon({
  name: "inv",
  aliases: ["inventory", "bag"],
  category: "economy",
  description: "View your inventory",

  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const user = await User.findOne({
        $or: [
          { whatsappNumber: sender },
          { id: sender },
          { userId: sender },
          { jid: sender },
        ],
      });

      if (!user) {
        return reply(
          "❌ You don't have an account yet. Send a message first to create one."
        );
      }

      const inventory = Array.isArray(user.inventory)
        ? user.inventory
        : [];

      if (inventory.length === 0) {
        return reply(
`╔══════════════════════╗
║     🎒 INVENTORY      ║
╚══════════════════════╝

📭 Your bag is empty!

💡 Visit the shop with *.shop* to buy items.`
        );
      }

      const itemCounts = {};

      for (const item of inventory) {
        const name =
          typeof item === "string"
            ? item
            : item?.name || "Unknown Item";

        const emoji =
          typeof item === "object"
            ? item?.emoji || "📦"
            : "📦";

        if (!itemCounts[name]) {
          itemCounts[name] = {
            count: 0,
            emoji,
          };
        }

        itemCounts[name].count++;
      }

      const username =
        sender?.split("@")[0] || "User";

      let text = `╔══════════════════════╗
║     🎒 INVENTORY      ║
╚══════════════════════╝

👤 *@${username}'s Bag*
📦 *Total Items:* ${inventory.length}

━━━━━━━━━━━━━━━━━━━━━━

`;

      let i = 1;
      for (const [name, data] of Object.entries(itemCounts)) {
        text += `*${i++}.* ${data.emoji} *${name}* — \`x${data.count}\`\n`;
      }

      text += `\n━━━━━━━━━━━━━━━━━━━━━━`;

      await sock.sendMessage(
        jid,
        {
          text,
          mentions: [sender],
        },
        {
          quoted: m,
        }
      );
    } catch (err) {
      console.error("========== INV COMMAND ERROR ==========");
      console.error(err);
      console.error("=======================================");

      return reply(
        `❌ Failed to fetch inventory.\n\n${err.message}`
      );
    }
  },
});