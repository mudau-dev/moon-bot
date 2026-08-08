require('dotenv').config();

module.exports = Object.freeze({
  MENU_IMAGE: process.env.MENU_IMAGE || '',
  PREFIX: process.env.PREFIX ?? '.',
  BOT_NAME: process.env.BOT_NAME || 'Moonlight Haven',
  BOT_JID: process.env.BOT_JID || '',
});
