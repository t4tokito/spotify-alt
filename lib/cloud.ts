import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "./firebase";
import type { Song } from "./music";
import type { Playlist } from "./playlists";

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
