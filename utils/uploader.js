const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Uploads a file to Telegra.ph
 * @param {string|Buffer} pathOrBuffer 
 * @returns {Promise<string>} - The uploaded file URL
 */
async function uploadToTelegraph(pathOrBuffer) {
  try {
    const form = new FormData();
    const content = typeof pathOrBuffer === 'string' ? fs.createReadStream(pathOrBuffer) : pathOrBuffer;
    form.append('file', content, { filename: 'file.mp4' });

    const response = await axios.post('https://telegra.ph/upload', form, {
      headers: {
        ...form.getHeaders()
      }
    });

    if (response.data && response.data[0] && response.data[0].src) {
      return 'https://telegra.ph' + response.data[0].src;
    }
    throw new Error('Upload failed: ' + JSON.stringify(response.data));
  } catch (err) {
    console.error('Telegraph upload error:', err.message);
    throw err;
  }
}

module.exports = { uploadToTelegraph };
