import { YT_URL } from "../config";
import type { Song } from "./saavn";

type YTResult = {
  videoId: string;
  title: string;
  channel: string;
  duration: number;
  views: number;
  thumbnail: string;
};

/** Search YouTube via our server. Artwork = video thumbnail. */
export async function searchYouTube(query: string, limit = 15): Promise<Song[]> {
  const res = await fetch(
    `${YT_URL}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) throw new Error("YT server se connect nahi hua");
  const json = await res.json();
  const results: YTResult[] = json.results ?? [];
  return results.map(
    (r): Song => ({
      id: `yt:${r.videoId}`,
      source: "youtube",
      videoId: r.videoId,
      name: r.title,
      albumName: "",
      albumId: "",
      duration: r.duration ?? 0,
      year: "",
      language: "",
      playCount: r.views ?? 0,
      explicit: false,
      hasLyrics: false,
      image: r.thumbnail,
      imageSmall: r.thumbnail,
      artists: r.channel,
      artistIds: "",
      url: "", // resolved at play time (links expire in ~6h)
      downloadUrl: [],
    })
  );
}

/** Resolve a fresh playable stream URL (call right before playing). */
export async function resolveYouTubeStream(videoId: string): Promise<string> {
  const res = await fetch(`${YT_URL}/api/stream?v=${encodeURIComponent(videoId)}`);
  if (!res.ok) throw new Error("Stream resolve nahi hua");
  const json = await res.json();
  if (!json.url) throw new Error("Koi playable audio nahi mila");
  return json.url as string;
}
