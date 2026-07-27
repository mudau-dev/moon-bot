const { fetchAnimeNews, sendNewsToGroups } = require("../../handlers/News");
const NewsGroup = require("../../models/athers/NewsGroup");
const { isMod } = require("../../database/users");

moon({
  name: "news",
  category: "general",
  description: "Anime news & spotlight system",
  aliases: ["animenews", "anews"],
  subcommands: ["on", "off"],
  async execute(sock, jid, sender, args, m, { reply }) {
    try {
      const subCmd = (args[0] || "").toLowerCase();

      // ── .news on ──────────────────────────────────────────────────────────
      if (subCmd === "on") {
        if (!(await isMod(sender))) {
          return reply("❌ Only mods/owners can enable anime news.");
        }
        if (!jid.endsWith("@g.us")) {
          return reply("❌ This command only works in groups.");
        }
        await NewsGroup.findOneAndUpdate(
          { groupJid: jid },
          { groupJid: jid, enabled: true, addedBy: sender },
          { upsert: true }
        );
        return reply(
`✅ *Anime News Enabled!*

📺 This group will now receive anime spotlights and news updates every 30 minutes.

Use *.news off* to disable.`
        );
      }

      // ── .news off ─────────────────────────────────────────────────────────
      if (subCmd === "off") {
        if (!(await isMod(sender))) {
          return reply("❌ Only mods/owners can disable anime news.");
        }
        await NewsGroup.deleteOne({ groupJid: jid });
        return reply("✅ Anime news has been disabled for this group.");
      }

      // ── .news (fetch now) ─────────────────────────────────────────────────
      await sock.sendMessage(jid, {
        text: "📡 *Fetching latest anime spotlight...*"
      }, { quoted: m });

      const newsArticles = await fetchAnimeNews();

      if (!newsArticles?.length) {
        return reply(
`❌ Could not fetch anime news right now.

Please try again in a few minutes.`
        );
      }

      await sendNewsToGroups(sock, newsArticles, [jid]);

    } catch (err) {
      console.error("[NEWS CMD ERROR]", err);
      return reply("❌ News command failed. Please try again.");
    }
  }
});
