const { exec } = require('child_process');
const { isTrueOwner } = require('../../database/users');
const config = require('../../config');
const path = require('path');

moon({
  name: "upd",
  category: "owner",
  description: "Update the bot from the GitHub repository",
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isTrueOwner(sender))) return reply("❌ This command is only for the True Owner.");

    const sentMsg = await sock.sendMessage(jid, { text: "🚀 *Checking for updates...*" }, { quoted: m });
    
    const editMsg = async (text) => {
      await sock.sendMessage(jid, { 
        text, 
        edit: sentMsg.key 
      });
    };

    const rootDir = path.join(__dirname, '../../');
    const repoUrl = "https://github.com/mudau-dev/moon-bot.git";
    
    // Construct authenticated URL if token exists
    let remote = repoUrl;
    if (config.GITHUB_TOKEN) {
      remote = repoUrl.replace("https://", `https://${config.GITHUB_TOKEN}@`);
    }

    // Step 1: Update remote URL temporarily for the pull
    exec(`git remote set-url origin ${remote}`, { cwd: rootDir }, (err) => {
      if (err) return editMsg(`❌ Error setting remote: ${err.message}`);

      // Step 2: Pull changes
      exec('git pull', { cwd: rootDir }, (pullErr, stdout, stderr) => {
        // Reset remote URL for security
        exec(`git remote set-url origin ${repoUrl}`, { cwd: rootDir });

        if (pullErr) {
          return editMsg(`❌ *Update Failed*\n\n\`\`\`${pullErr.message}\`\`\``);
        }

        if (stdout.includes('Already up to date.')) {
          return editMsg("✅ *The bot is already up to date.*");
        }

        editMsg(`✅ *Update Successful!*\n\n*Changes:*\n\`\`\`${stdout.slice(0, 500)}\`\`\`\n\n🔄 *Restarting to apply changes...*`);

        // Step 3: Restart
        setTimeout(() => {
          process.exit(0);
        }, 3000);
      });
    });
  }
});
