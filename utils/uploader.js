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

async function uploadToCatbox(pathOrBuffer, options = {}) {
  const form = new FormData();
  const filename = options.filename || (typeof pathOrBuffer === 'string' ? path.basename(pathOrBuffer) : 'moonlight-upload.bin');
  const content = typeof pathOrBuffer === 'string' ? fs.createReadStream(pathOrBuffer) : pathOrBuffer;

  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', content, { filename });

  try {
    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 60_000,
    });
    const url = String(response.data || '').trim();
    if (!/^https:\/\/files\.catbox\.moe\//.test(url)) {
      throw new Error('Catbox returned an unexpected response.');
    }
    return url;
  } catch (error) {
    console.error('Catbox upload error:', error.message);
    throw error;
  }
}

module.exports = { uploadToTelegraph, uploadToCatbox };
