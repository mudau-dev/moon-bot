const { exec } = require('child_process');
const { isTrueOwner } = require('../../database/users');

moon({
  name: "upd",
  category: "owner",
  description: "Update the bot from the GitHub repository",
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isTrueOwner(sender))) return reply("❌ This command is only for the True Owner.");

    await reply("🚀 Fetching updates from the repository...");

    exec('git pull', (err, stdout, stderr) => {
      if (err) {
        return reply(`❌ Error during update:\n\`\`\`${err.message}\`\`\``);
      }
      
      if (stdout.includes('Already up to date.')) {
        return reply("✅ The bot is already up to date.");
      }

      let response = `✅ Update successful!\n\n*Output:*\n\`\`\`${stdout}\`\`\``;
      if (stderr) {
        response += `\n\n*Warnings:*\n\`\`\`${stderr}\`\`\``;
      }
      
      response += `\n\n🔄 Restarting the bot to apply changes...`;
      reply(response);

      // Restart the process (assuming it's managed by PM2 or similar)
      setTimeout(() => {
        process.exit(0);
      }, 3000);
    });
  }
});
