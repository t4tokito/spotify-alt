import { collection, deleteDoc, doc, getDoc, getDocs, increment, limit, orderBy, query, setDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { Song } from "./music";
import type { Playlist } from "./playlists";
import type { PlayStat } from "./player";

/** Firestore drops fields with `undefined` — strip them before writing. */
function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function noDb(): boolean {
  return !db;
}

// ---------- liked (one doc per song: users/{uid}/liked/{songId}) ----------

export async function loadCloudLiked(uid: string): Promise<Record<string, Song>> {
  if (noDb()) return {};
  const snap = await getDocs(collection(db, "users", uid, "liked"));
  const out: Record<string, Song> = {};
  snap.forEach((d) => {
    out[d.id] = d.data() as Song;
  });
  return out;
}

export async function likeCloud(uid: string, song: Song): Promise<void> {
  if (noDb()) return;
  await setDoc(doc(db, "users", uid, "liked", song.id), clean(song));
}

export async function unlikeCloud(uid: string, songId: string): Promise<void> {
  if (noDb()) return;
  await deleteDoc(doc(db, "users", uid, "liked", songId));
}

// ---------- history (array field on users/{uid}) ----------

export async function loadCloudHistory(uid: string): Promise<Song[]> {
  if (noDb()) return [];
  const snap = await getDoc(doc(db, "users", uid));
  const h = snap.data()?.history;
  return Array.isArray(h) ? (h as Song[]) : [];
}

export async function saveCloudHistory(uid: string, songs: Song[]): Promise<void> {
  if (noDb()) return;
  await setDoc(doc(db, "users", uid), { history: clean(songs.slice(0, 50)) }, { merge: true });
}

// ---------- play stats (map field on users/{uid}) ----------

export async function loadCloudStats(uid: string): Promise<Record<string, PlayStat>> {
  if (noDb()) return {};
  const snap = await getDoc(doc(db, "users", uid));
  const st = snap.data()?.playStats;
  return st && typeof st === "object" ? (st as Record<string, PlayStat>) : {};
}

export async function saveCloudStats(uid: string, stats: Record<string, PlayStat>): Promise<void> {
  if (noDb()) return;
  const entries = Object.entries(stats).slice(0, 300);
  await setDoc(doc(db, "users", uid), { playStats: clean(Object.fromEntries(entries)) }, { merge: true });
}

// ---------- playlists (one doc each: users/{uid}/playlists/{plId}) ----------

export async function loadCloudPlaylists(uid: string): Promise<Playlist[]> {
  if (noDb()) return [];
  const snap = await getDocs(collection(db, "users", uid, "playlists"));
  const out: Playlist[] = [];
  snap.forEach((d) => {
    out.push(d.data() as Playlist);
  });
  return out.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function saveCloudPlaylist(uid: string, pl: Playlist): Promise<void> {
  if (noDb()) return;
  await setDoc(doc(db, "users", uid, "playlists", pl.id), clean({ ...pl, ownerUid: uid }));
}

export async function deleteCloudPlaylist(uid: string, id: string): Promise<void> {
  if (noDb()) return;
  await deleteDoc(doc(db, "users", uid, "playlists", id));
}

/** Someone else's public playlists. */
export async function loadUserPublicPlaylists(uid: string): Promise<Playlist[]> {
  if (noDb()) return [];
  const snap = await getDocs(
    query(collection(db, "users", uid, "playlists"), where("visibility", "==", "public"))
  );
  const out: Playlist[] = [];
  snap.forEach((d) => {
    out.push(d.data() as Playlist);
  });
  return out.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

/** Single public playlist doc (for opening someone's playlist). */
export async function loadPublicPlaylist(ownerUid: string, id: string): Promise<Playlist | null> {
  if (noDb()) return null;
  const snap = await getDoc(doc(db, "users", ownerUid, "playlists", id));
  if (!snap.exists()) return null;
  const pl = snap.data() as Playlist;
  return pl.visibility === "public" ? pl : null;
}

// ---------- global trending (play counts across the whole app) ----------

export async function bumpGlobalPlay(song: Song): Promise<void> {
  if (noDb()) return;
  await setDoc(
    doc(db, "stats_global", song.id),
    { count: increment(1), song: clean(song), last: Date.now() },
    { merge: true }
  ).catch(() => {});
}

export async function getGlobalTrending(limitCount = 12): Promise<{ song: Song; count: number }[]> {
  if (noDb()) return [];
  const snap = await getDocs(query(collection(db, "stats_global"), orderBy("count", "desc"), limit(limitCount)));
  const out: { song: Song; count: number }[] = [];
  snap.forEach((d) => {
    const data = d.data() as any;
    if (data.song?.url) out.push({ song: data.song as Song, count: data.count ?? 0 });
  });
  return out;
}

// ---------- follow (insta-style) ----------

export type FollowDoc = { uid: string; username: string; photoURL?: string | null; at: number };

export async function followUser(
  meUid: string,
  me: { username: string; photoURL?: string | null },
  target: { uid: string; username: string; photoURL?: string | null }
): Promise<void> {
  if (noDb() || meUid === target.uid) return;
  const batch = writeBatch(db);
  batch.set(doc(db, "users", meUid, "following", target.uid), { ...target, at: Date.now() });
  batch.set(doc(db, "users", target.uid, "followers", meUid), { uid: meUid, ...me, at: Date.now() });
  await batch.commit();
}

export async function unfollowUser(meUid: string, targetUid: string): Promise<void> {
  if (noDb()) return;
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", meUid, "following", targetUid));
  batch.delete(doc(db, "users", targetUid, "followers", meUid));
  await batch.commit();
}

export async function isFollowing(meUid: string, targetUid: string): Promise<boolean> {
  if (noDb()) return false;
  const snap = await getDoc(doc(db, "users", meUid, "following", targetUid));
  return snap.exists();
}

export async function getFollowing(uid: string): Promise<FollowDoc[]> {
  if (noDb()) return [];
  const snap = await getDocs(collection(db, "users", uid, "following"));
  const out: FollowDoc[] = [];
  snap.forEach((d) => out.push(d.data() as FollowDoc));
  return out;
}

export async function getFollowers(uid: string): Promise<FollowDoc[]> {
  if (noDb()) return [];
  const snap = await getDocs(collection(db, "users", uid, "followers"));
  const out: FollowDoc[] = [];
  snap.forEach((d) => out.push(d.data() as FollowDoc));
  return out;
}

/** Random songs from public playlists of people you follow (explore feed). */
export async function getFollowExplore(uid: string, limit = 10): Promise<Song[]> {
  if (noDb()) return [];
  const following = await getFollowing(uid);
  if (following.length === 0) return [];
  const picks = [...following].sort(() => Math.random() - 0.5).slice(0, 5);
  const batches = await Promise.all(
    picks.map((f) => loadUserPublicPlaylists(f.uid).catch(() => [] as Playlist[]))
  );
  const seen = new Set<string>();
  const songs: Song[] = [];
  for (const pls of batches) {
    for (const p of pls) {
      for (const s of p.songs) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          songs.push(s);
        }
      }
    }
  }
  return songs.sort(() => Math.random() - 0.5).slice(0, limit);
}
