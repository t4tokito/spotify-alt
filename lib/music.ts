export type ArtImage = { quality: string; url: string };
export type StreamFile = { quality: string; url: string };

export type Song = {
  id: string;
  name: string;
  albumName: string;
  albumId: string;
  duration: number; // seconds
  year: string;
  language: string;
  playCount: number;
  explicit: boolean;
  hasLyrics: boolean;
  image: string; // 500x500
  imageSmall: string;
  artists: string;
  artistIds: string;
  url: string; // stream url 320kbps preferred
  downloadUrl: StreamFile[];
};

// Free music API mirrors (tried in order, first working one wins).
const MIRRORS = [
  "https://saavnx.vercel.app",
  "https://saavn.sumit.co",
  "https://saavn.dev",
];

function pickImage(images: ArtImage[] | undefined, q = "500x500"): string {
  if (!images || images.length === 0) return "";
  return images.find((i) => i.quality === q)?.url ?? images[images.length - 1].url;
}

function pickStream(downloads: StreamFile[] | undefined): string {
  if (!downloads || downloads.length === 0) return "";
  const pref = ["320kbps", "160kbps", "96kbps", "48kbps", "12kbps"];
  for (const q of pref) {
    const f = downloads.find((d) => d.quality === q);
    if (f) return f.url;
  }
  return downloads[downloads.length - 1].url;
}

export function normalizeSong(raw: any): Song {
  const primary: any[] = raw?.artists?.primary ?? [];
  const artists = primary.map((a) => a.name).join(", ") || raw?.primaryArtists || "Unknown Artist";
  return {
    id: String(raw.id),
    name: decodeHtml(raw.name ?? "Unknown"),
    albumName: decodeHtml(raw?.album?.name ?? ""),
    albumId: String(raw?.album?.id ?? ""),
    duration: Number(raw.duration ?? 0),
    year: String(raw.year ?? ""),
    language: String(raw.language ?? ""),
    playCount: Number(raw.playCount ?? 0),
    explicit: Boolean(raw.explicitContent),
    hasLyrics: Boolean(raw.hasLyrics),
    image: pickImage(raw.image, "500x500"),
    imageSmall: pickImage(raw.image, "150x150"),
    artists,
    artistIds: primary.map((a) => a.id).join(","),
    url: pickStream(raw.downloadUrl),
    downloadUrl: raw.downloadUrl ?? [],
  };
}

function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchMirror(path: string): Promise<any> {
  let lastErr: any = null;
  for (const base of MIRRORS) {
    try {
      const res = await fetch(`${base}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("All music servers busy, try again");
}

export async function searchSongs(query: string, limit = 20): Promise<Song[]> {
  const json = await fetchMirror(`/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
  const results = json?.data?.results ?? [];
  return results.map(normalizeSong).filter((s: Song) => s.url);
}

export async function getSong(id: string): Promise<Song> {
  const json = await fetchMirror(`/api/songs/${id}`);
  const raw = json?.data?.[0] ?? json?.data;
  return normalizeSong(raw);
}

export async function getSuggestions(id: string, limit = 20): Promise<Song[]> {
  const json = await fetchMirror(`/api/songs/${id}/suggestions?limit=${limit}`);
  const results = json?.data ?? [];
  return (Array.isArray(results) ? results : []).map(normalizeSong).filter((s: Song) => s.url);
}

export async function searchAlbums(query: string, limit = 10): Promise<any[]> {
  const json = await fetchMirror(`/api/search/albums?query=${encodeURIComponent(query)}&limit=${limit}`);
  return json?.data?.results ?? [];
}

export type Playlist = { id: string; name: string; songCount: number };

export async function searchPlaylists(query: string, limit = 5): Promise<Playlist[]> {
  const json = await fetchMirror(`/api/search/playlists?query=${encodeURIComponent(query)}&limit=${limit}`);
  const results = json?.data?.results ?? [];
  return results
    .filter((r: any) => r && r.id)
    .map((r: any) => ({ id: String(r.id), name: r.name ?? "", songCount: r.songCount ?? 0 }));
}

export async function getPlaylistSongs(id: string, limit = 30): Promise<Song[]> {
  const json = await fetchMirror(`/api/playlists?id=${encodeURIComponent(id)}&limit=${limit}`);
  const songs = json?.data?.songs ?? [];
  return songs.map(normalizeSong).filter((s: Song) => s.url);
}

/** Instagram/Reels viral playlists se trending gaane (merged + deduped). */
export async function getInstagramTrending(limit = 20): Promise<Song[]> {
  const queries = ["instagram trending songs", "reels viral", "instagram viral hits"];
  const found: Playlist[] = [];
  const searches = await Promise.all(queries.map((q) => searchPlaylists(q, 3).catch(() => [] as Playlist[])));
  for (const pls of searches) {
    for (const p of pls) {
      if (!found.some((x) => x.id === p.id)) found.push(p);
    }
  }
  const batches = await Promise.all(
    found.slice(0, 3).map((p) => getPlaylistSongs(p.id, 15).catch(() => [] as Song[]))
  );
  const seen = new Set<string>();
  const out: Song[] = [];
  for (const songs of batches) {
    for (const s of songs) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        out.push(s);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

export const HOME_SECTIONS: { title: string; query: string }[] = [
  { title: "Arijit Singh Essentials", query: "arijit singh" },
  { title: "Punjabi Party", query: "punjabi hits diljit" },
  { title: "Lo-Fi & Chill", query: "lofi chill hindi" },
  { title: "90s Evergreen", query: "90s hindi evergreen" },
  { title: "English Top Hits", query: "english top hits" },
];

export function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
