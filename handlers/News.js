const axios = require("axios");
const NewsGroup = require("../models/athers/NewsGroup");

const NEWS_INTERVAL = 30 * 60 * 1000; // 30 minutes
let newsTimer = null;

// ── Fetch trending/airing anime from AniList (with real images) ───────────────
async function fetchAniListTrending() {
  try {
    const query = `
      {
        Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: TRENDING_DESC, status: RELEASING) {
            title { romaji english }
            description(asHtml: false)
            coverImage { large extraLarge }
            bannerImage
            siteUrl
            episodes
            averageScore
            genres
            season
            seasonYear
            studios(isMain: true) { nodes { name } }
            nextAiringEpisode { episode airingAt }
          }
        }
      }
    `;

    const response = await axios.post(
      "https://graphql.anilist.co",
      { query },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000
      }
    );

    const mediaList = response.data?.data?.Page?.media || [];
    return mediaList.map(m => {
      const title = m.title.english || m.title.romaji;
      const studio = m.studios?.nodes?.[0]?.name || "Unknown Studio";
      const genres = (m.genres || []).slice(0, 4).join(" • ");
      const score = m.averageScore ? `${m.averageScore}/100` : "N/A";
      const eps = m.episodes ? `${m.episodes} eps` : "Ongoing";
      const season = m.season && m.seasonYear ? `${m.season} ${m.seasonYear}` : "";
      const nextEp = m.nextAiringEpisode
        ? `Episode ${m.nextAiringEpisode.episode} airing <t:${m.nextAiringEpisode.airingAt}:R>`
        : null;

      // Clean HTML tags from description
      const rawDesc = (m.description || "No description available.")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<i>(.*?)<\/i>/gi, "_$1_")
        .replace(/<b>(.*?)<\/b>/gi, "*$1*")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();

      // Truncate description to ~600 chars but end at a sentence
      let desc = rawDesc;
      if (desc.length > 600) {
        const cut = desc.lastIndexOf(".", 600);
        desc = cut > 200 ? desc.slice(0, cut + 1) : desc.slice(0, 600) + "...";
      }

      return {
        title,
        description: desc,
        imageUrl: m.bannerImage || m.coverImage?.extraLarge || m.coverImage?.large,
        coverUrl: m.coverImage?.large,
        url: m.siteUrl,
        studio,
        genres,
        score,
        eps,
        season,
        nextEp,
        type: "trending"
      };
    });
  } catch (err) {
    console.error("[NEWS] AniList fetch failed:", err.message);
    return [];
  }
}

// ── Fetch latest anime news from ANN RSS ─────────────────────────────────────
async function fetchANNNews() {
  try {
    const response = await axios.get(
      "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us",
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AnimeBot/1.0)" },
        timeout: 15000
      }
    );

    const xml = response.data;
    const items = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const item of itemMatches.slice(0, 10)) {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                     item.match(/<title>(.*?)<\/title>/))?.[1]?.trim();
      const link  = (item.match(/<link>(.*?)<\/link>/))?.[1]?.trim();
      const desc  = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                     item.match(/<description>(.*?)<\/description>/))?.[1]?.trim();
      const cat   = (item.match(/<category>(.*?)<\/category>/))?.[1]?.trim();
      const date  = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]?.trim();

      if (!title || !link) continue;
      if (cat && !["Anime", "Manga", "Game"].includes(cat)) continue;

      // Try to get image from the article page
      let imageUrl = null;
      try {
        const articleRes = await axios.get(link, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 8000
        });
        const imgMatch = articleRes.data.match(
          /property="og:image"\s+content="([^"]+)"|<img[^>]+src="(https:\/\/cdn\.animenewsnetwork\.com[^"]+)"/
        );
        if (imgMatch) imageUrl = imgMatch[1] || imgMatch[2];
      } catch (_) {}

      items.push({
        title,
        description: desc || "Read the full article for more details.",
        imageUrl,
        url: link,
        date,
        type: "news"
      });

      if (items.length >= 5) break;
    }

    return items;
  } catch (err) {
    console.error("[NEWS] ANN RSS fetch failed:", err.message);
    return [];
  }
}

// ── Main fetch function — tries AniList first, falls back to ANN ──────────────
async function fetchAnimeNews() {
  const trending = await fetchAniListTrending();
  if (trending.length > 0) return trending;
  return fetchANNNews();
}

// ── Format and send a news article ───────────────────────────────────────────
async function sendNewsToGroups(sock, newsArticles, targetGroups = null) {
  if (!newsArticles?.length) return;

  // Pick a random article
  const article = newsArticles[Math.floor(Math.random() * newsArticles.length)];

  let groups = [];
  if (Array.isArray(targetGroups) && targetGroups.length) {
    groups = targetGroups;
  } else {
    const dbGroups = await NewsGroup.find({ enabled: true });
    groups = dbGroups.map(g => g.groupJid);
  }

  let caption = "";

  if (article.type === "trending") {
    caption =
`╔══════════════════════╗
║   📺  *ANIME SPOTLIGHT*   ║
╚══════════════════════╝

🌟 *${article.title}*
${article.season ? `📅 *Season:* ${article.season}\n` : ""}🎬 *Studio:* ${article.studio}
🎭 *Genres:* ${article.genres}
⭐ *Score:* ${article.score}
📺 *Episodes:* ${article.eps}

━━━━━━━━━━━━━━━━━━━━━━

📖 *Synopsis*

${article.description}

━━━━━━━━━━━━━━━━━━━━━━
${article.nextEp ? `\n⏰ *Next Episode:* ${article.nextEp}\n` : ""}
🔗 *More Info:* ${article.url}

_Stay tuned for more anime updates!_ 🌙`;
  } else {
    caption =
`╔════════════════════╗
║   📰  *ANIME NEWS*      ║
╚═════════════════════╝

📌 *${article.title}*
${article.date ? `📅 *Published:* ${article.date}\n` : ""}
━━━━━━━━━━━━━━━━━━━━━━

${article.description}

━━━━━━━━━━━━━━━━━━━━━━

🔗 *Read Full Article:*
${article.url}

_Stay tuned for more updates!_ 🌙`;
  }

  for (const groupJid of groups) {
    try {
      if (article.imageUrl) {
        await sock.sendMessage(groupJid, {
          image: { url: article.imageUrl },
          caption
        });
      } else {
        await sock.sendMessage(groupJid, { text: caption });
      }
    } catch (err) {
      console.error(`[NEWS] Failed to send to ${groupJid}:`, err.message);
    }
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
async function startNewsScheduler(sock) {
  if (newsTimer) clearInterval(newsTimer);

  const task = async () => {
    try {
      const news = await fetchAnimeNews();
      if (news.length) await sendNewsToGroups(sock, news);
    } catch (err) {
      console.error("[NEWS SCHEDULER ERROR]", err.message);
    }
  };

  newsTimer = setInterval(task, NEWS_INTERVAL);
}

function stopNewsScheduler() {
  if (newsTimer) {
    clearInterval(newsTimer);
    newsTimer = null;
  }
}

module.exports = {
  fetchAnimeNews,
  sendNewsToGroups,
  startNewsScheduler,
  stopNewsScheduler
};
