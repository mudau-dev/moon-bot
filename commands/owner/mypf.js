/**
 * commands/owner/mypf.js
 * 
 * Usage: .mypf <url>
 * Sets animated profile background.
 * Optimized for low-memory and handles FFmpeg permission issues.
 */

const { findOrCreateWhatsApp } = require("../../database/users");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// ── FFmpeg Path Resolution & Permission Fix ──────────────────────────────────

function setupFfmpeg() {
  try {
    const ffmpegStatic = require("ffmpeg-static");
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
      // Try to ensure execution permission
      try {
        execSync(`chmod +x ${ffmpegStatic}`);
      } catch (e) {
        console.error("Failed to chmod ffmpeg-static:", e.message);
      }
      ffmpeg.setFfmpegPath(ffmpegStatic);
      return;
    }
  } catch (e) {
    console.error("ffmpeg-static not found, falling back to system ffmpeg");
  }
  
  // Fallback to system ffmpeg
  ffmpeg.setFfmpegPath("ffmpeg");
}

setupFfmpeg();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadToTemp(url, ext) {
  const tmpPath = path.join(os.tmpdir(), `mypf_${Date.now()}${ext}`);
  const response = await axios.get(url, { 
    responseType: "arraybuffer", 
    timeout: 60000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  fs.writeFileSync(tmpPath, Buffer.from(response.data));
  return tmpPath;
}

function trimToGif(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .inputOptions(["-t 10"])
      .outputOptions([
        "-vf", "scale=240:-1,fps=8",
        "-loop", "0",
        "-an"
      ])
      .toFormat("gif")
      .on("end", () => resolve(outputPath))
      .on("error", (err) => {
        console.error("FFmpeg execution error:", err);
        reject(err);
      })
      .save(outputPath);
  });
}

async function uploadToCatbox(filePath) {
  try {
    const FormData = require("form-data");
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(filePath));

    const res = await axios.post("https://catbox.moe/user.php", form, {
      headers: form.getHeaders(),
      timeout: 60000
    });

    if (res.data && res.data.startsWith("https://")) {
      return res.data.trim();
    }
    return null;
  } catch (err) {
    return null;
  }
}

// ── Command ───────────────────────────────────────────────────────────────────

moon({
  name: "mypf",
  category: "owner",
  roles: ["Owner", "True Owner"],
  description: "Set your profile animated GIF background",
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const senderUser = await findOrCreateWhatsApp(sender);
      if (!senderUser) return reply("❌ User not found.");

      const allowedRoles = ["Owner", "True Owner"];
      if (!allowedRoles.includes(senderUser.role) && !senderUser.isTrueOwner) {
        return reply("❌ Permission denied.");
      }

      const url = args[0];
      if (!url || !url.startsWith("http")) return reply("❌ Usage: .mypf <url>");

      await reply("⏳ Processing animated background... (this may take 30-60s)");

      const inputExt = url.toLowerCase().includes(".gif") ? ".gif" : ".mp4";
      let inputPath, outputPath;

      try {
        inputPath = await downloadToTemp(url, inputExt);
        outputPath = path.join(os.tmpdir(), `mypf_out_${Date.now()}.gif`);
        
        await trimToGif(inputPath, outputPath);
        
        const hostedUrl = await uploadToCatbox(outputPath);
        if (!hostedUrl) throw new Error("Upload failed to catbox");

        senderUser.videoBackground = hostedUrl;
        senderUser.backgroundImage = hostedUrl;
        await senderUser.save();

        return reply(`✅ *Success!* Animated background set.\n🔗 ${hostedUrl}`, { mentions: [sender] });

      } catch (err) {
        console.error("MYPF PROCESSING ERROR:", err);
        return reply(`❌ Error: ${err.message || "FFmpeg permission or memory issue"}`);
      } finally {
        if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }
    } catch (err) {
      return reply("❌ Unexpected error.");
    }
  }
});
