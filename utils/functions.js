/**
 * Clean a phone number string (remove @s.whatsapp.net, +, etc.)
 * @param {string} text 
 * @returns {string}
 */
function userNumber(text) {
  if (!text) return "";
  return text.replace(/[^0-9]/g, "");
}

module.exports = {
  userNumber
};