const { exec } = require('child_process');
const { isTrueOwner } = require('../../database/users');
const path = require('path');

moon({
  name: 'upd',
  category: 'owner',
  description: 'Update the bot from its configured Git remote.',
  async execute(sock, jid, sender, args, m, { reply }) {
    if (!(await isTrueOwner(sender))) return reply('❌ This command is only for the True Owner.');

    const sentMessage = await sock.sendMessage(jid, { text: '🚀 *Checking for updates…*' }, { quoted: m });
    const editMessage = (text) => sock.sendMessage(jid, { text, edit: sentMessage.key });
    const rootDir = path.join(__dirname, '../../');

    exec('git pull --ff-only origin main', { cwd: rootDir, timeout: 60_000 }, (error, stdout, stderr) => {
      if (error) {
        const detail = (stderr || error.message).slice(0, 500);
        return editMessage(`❌ *Update failed*\n\n\`\`\`${detail}\`\`\``);
      }
      if (stdout.includes('Already up to date.')) return editMessage('✅ *The bot is already up to date.*');

      editMessage(`✅ *Update successful!*\n\n\`\`\`${stdout.slice(0, 500)}\`\`\`\n\n🔄 Restarting to apply changes…`);
      setTimeout(() => process.exit(0), 3_000);
      return undefined;
    });
  },
});
