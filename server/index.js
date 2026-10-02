require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ytdlp = require("yt-dlp-exec");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
// YouTube blocks most datacenter IPs for the web player client.
// The android client usually still works from servers (Render, etc.).
// Override with YT_PLAYER_CLIENT=web / tv if needed.
const PLAYER_CLIENT = process.env.YT_PLAYER_CLIENT || "android";
const SEARCH_CACHE_MS = 10 * 60 * 1000;
const STREAM_CACHE_MS = 5 * 60 * 60 * 1000;

/** Tiny TTL cache: Map<key, { at, value }> */
const cache = new Map();
function cacheGet(key, ttl) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttl) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}
function cacheSet(key, value) {
  if (cache.size > 300) cache.clear();
  cache.set(key, { at: Date.now(), value });
}

function thumbFor(videoId, thumbs) {
  if (Array.isArray(thumbs) && thumbs.length > 0) {
    const big = thumbs[thumbs.length - 1];
    if (big && big.url) return big.url;
  }
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function extractVideoId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

const baseFlags = {
  noWarnings: true,
  extractorArgs: `youtube:player_client=${PLAYER_CLIENT}`,
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, playerClient: PLAYER_CLIENT, ytDlp: ytdlpVersion });
});

/** Search YouTube, return tracks with video thumbnails. */
app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10) || 10, 1), 25);
  if (!q) return res.status(400).json({ error: "Missing ?q=" });

  const cacheKey = `search:${q}:${limit}`;
  const hit = cacheGet(cacheKey, SEARCH_CACHE_MS);
  if (hit) return res.json({ cached: true, results: hit });

  try {
    const raw = await ytdlp(`ytsearch${limit}:${q}`, {
      ...baseFlags,
      dumpSingleJson: true,
      flatPlaylist: true,
      skipDownload: true,
    });
    const json = typeof raw === "string" ? JSON.parse(raw) : raw;
    const results = (json.entries || [])
      .filter((e) => e && e.id && e.title)
      .map((e) => ({
        videoId: e.id,
        title: e.title,
        channel: e.channel || e.uploader || "unknown",
        duration: e.duration || 0,
        views: e.view_count || 0,
        thumbnail: thumbFor(e.id, e.thumbnails),
      }));
    cacheSet(cacheKey, results);
    res.json({ cached: false, results });
  } catch (err) {
    console.error("search failed:", err.message);
    res.status(502).json({ error: "YouTube search failed, try again" });
  }
});

/** Resolve a video to a direct audio stream URL (expires in ~6h — resolve at play time). */
app.get("/api/stream", async (req, res) => {
  const videoId = extractVideoId(req.query.v);
  if (!videoId) return res.status(400).json({ error: "Missing ?v=videoId" });

  const cacheKey = `stream:${videoId}`;
  const hit = cacheGet(cacheKey, STREAM_CACHE_MS);
  if (hit) return res.json({ cached: true, ...hit });

  try {
    const raw = await ytdlp(`https://www.youtube.com/watch?v=${videoId}`, {
      ...baseFlags,
      dumpSingleJson: true,
      skipDownload: true,
      format: "bestaudio[ext=m4a]/bestaudio/best",
    });
    const info = typeof raw === "string" ? JSON.parse(raw) : raw;

    let url = info.url || info.requested_formats?.[0]?.url || null;
    if (!url && Array.isArray(info.formats)) {
      const audios = info.formats.filter((f) => f.url && (!f.vcodec || f.vcodec === "none"));
      audios.sort((a, b) => (b.abr || 0) - (a.abr || 0));
      url = audios[0]?.url || null;
    }
    if (!url) return res.status(502).json({ error: "No playable audio found" });

    const out = {
      videoId,
      title: info.title || "",
      channel: info.channel || info.uploader || "unknown",
      duration: info.duration || 0,
      thumbnail: thumbFor(videoId, info.thumbnails),
      url,
    };
    cacheSet(cacheKey, out);
    res.json({ cached: false, ...out });
  } catch (err) {
    console.error("stream failed:", err.message);
    res.status(502).json({ error: "Could not resolve stream (video blocked or private?)" });
  }
});

let ytdlpVersion = "unknown";
ytdlp("--version")
  .then((v) => {
    ytdlpVersion = String(v).trim();
    console.log("yt-dlp", ytdlpVersion);
  })
  .catch(() => {});

app.listen(PORT, () => {
  console.log(`tokito-music-yt listening on :${PORT} (playerClient=${PLAYER_CLIENT})`);
});
