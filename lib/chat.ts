import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Song } from "./music";

export type ChatDoc = {
  participants: string[];
  names: Record<string, string>;
  photos: Record<string, string | null>;
  lastText: string;
  updatedAt: number;
  unread?: Record<string, number>;
  lastRead?: Record<string, number>;
};

export type ChatMsg =
  | { id: string; from: string; fromName: string; kind: "text"; text: string; at: number }
  | { id: string; from: string; fromName: string; kind: "song"; song: Song; at: number }
  | {
      id: string;
      from: string;
      fromName: string;
      kind: "playlist";
      playlist: { id: string; ownerUid: string; name: string; songCount: number };
      at: number;
    };

function noDb(): boolean {
  return !db;
}

/** Deterministic 1-1 chat id so two users always land in the same thread. */
export function directChatId(a: string, b: string): string {
  return [a, b].sort().join("__");
}

export async function findOrCreateChat(
  me: { uid: string; username: string; photoURL?: string | null },
  peer: { uid: string; username: string; photoURL?: string | null }
): Promise<string> {
  const id = directChatId(me.uid, peer.uid);
  const ref = doc(db, "chats", id);
  // NOTE: getDoc on a not-yet-existing doc is denied by rules
  // (no resource to check against), so treat any read failure as "missing".
  let exists = false;
  try {
    exists = (await getDoc(ref)).exists();
  } catch {
    exists = false;
  }
  if (!exists) {
    await setDoc(ref, {
      participants: [me.uid, peer.uid].sort(),
      names: { [me.uid]: me.username, [peer.uid]: peer.username },
      photos: { [me.uid]: me.photoURL ?? null, [peer.uid]: peer.photoURL ?? null },
      lastText: "",
      updatedAt: Date.now(),
    });
  }
  return id;
}

export async function getMyChats(uid: string): Promise<(ChatDoc & { id: string })[]> {
  if (noDb()) return [];
  const snap = await getDocs(query(collection(db, "chats"), where("participants", "array-contains", uid)));
  const out: (ChatDoc & { id: string })[] = [];
  snap.forEach((d) => out.push({ id: d.id, ...(d.data() as ChatDoc) }));
  return out.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export function subscribeMyChats(uid: string, cb: (chats: (ChatDoc & { id: string })[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "chats"), where("participants", "array-contains", uid)),
    (snap) => {
      const out: (ChatDoc & { id: string })[] = [];
      snap.forEach((d) => out.push({ id: d.id, ...(d.data() as ChatDoc) }));
      cb(out.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)));
    },
    () => {}
  );
}

export function subscribeMessages(
  chatId: string,
  uid: string,
  cb: (msgs: ChatMsg[]) => void,
  onError?: (e: any) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, "chats", chatId, "messages"), where("participants", "array-contains", uid)),
    (snap) => {
      const out: ChatMsg[] = [];
      snap.forEach((d) => {
        const m = d.data() as any;
        out.push({
          id: d.id,
          from: m.from,
          fromName: m.fromName ?? "",
          kind: m.kind ?? "text",
          text: m.text ?? "",
          song: m.song,
          playlist: m.playlist,
          at: typeof m.at === "number" ? m.at : 0,
        });
      });
      cb(out.sort((a, b) => a.at - b.at));
    },
    (e) => onError?.(e)
  );
}

async function pushMessage(
  chatId: string,
  participants: string[],
  msg: Record<string, unknown>,
  preview: string
): Promise<void> {
  const ref = doc(collection(db, "chats", chatId, "messages"));
  const fromUid = msg.from as string;
  await setDoc(ref, { ...msg, participants, at: Date.now() });
  const bump: Record<string, unknown> = {
    lastText: preview.slice(0, 80),
    updatedAt: Date.now(),
  };
  for (const p of participants) {
    if (p !== fromUid) bump[`unread.${p}`] = increment(1);
  }
  await updateDoc(doc(db, "chats", chatId), bump).catch(() => {});
}

/** Mark thread as read for me (clears my badge). */
export async function markRead(chatId: string, uid: string): Promise<void> {
  if (noDb()) return;
  await updateDoc(doc(db, "chats", chatId), {
    [`unread.${uid}`]: 0,
    [`lastRead.${uid}`]: Date.now(),
  }).catch(() => {});
}

/** Live single chat doc (for Seen ticks + fresh names/photos). */
export function subscribeChat(chatId: string, cb: (chat: ChatDoc | null) => void): Unsubscribe {
  return onSnapshot(
    doc(db, "chats", chatId),
    (d) => cb(d.exists() ? (d.data() as ChatDoc) : null),
    () => {}
  );
}

export async function sendText(
  chatId: string,
  participants: string[],
  from: { uid: string; username: string },
  text: string
): Promise<void> {
  const t = text.trim();
  if (!t) return;
  await pushMessage(
    chatId,
    participants,
    { from: from.uid, fromName: from.username, kind: "text", text: t, createdAt: serverTimestamp() },
    t
  );
}

export async function sendSong(
  chatId: string,
  participants: string[],
  from: { uid: string; username: string },
  song: Song
): Promise<void> {
  await pushMessage(
    chatId,
    participants,
    { from: from.uid, fromName: from.username, kind: "song", song: JSON.parse(JSON.stringify(song)), createdAt: serverTimestamp() },
    `Song: ${song.name}`
  );
}

export async function sendPlaylist(
  chatId: string,
  participants: string[],
  from: { uid: string; username: string },
  pl: { id: string; ownerUid: string; name: string; songCount: number }
): Promise<void> {
  await pushMessage(
    chatId,
    participants,
    { from: from.uid, fromName: from.username, kind: "playlist", playlist: pl, createdAt: serverTimestamp() },
    `Playlist: ${pl.name}`
  );
}

export function peerOf(chat: ChatDoc, meUid: string): { uid: string; username: string; photoURL?: string | null } {
  const uid = chat.participants.find((p) => p !== meUid) ?? meUid;
  return { uid, username: chat.names?.[uid] ?? "Unknown", photoURL: chat.photos?.[uid] ?? null };
}

/** Push my new avatar into every chat I'm in (heals stale list photos). */
export async function refreshMyChatPhotos(uid: string, photo: string | null): Promise<void> {
  if (noDb()) return;
  try {
    const chats = await getMyChats(uid);
    if (chats.length === 0) return;
    const batch = writeBatch(db);
    for (const c of chats) {
      batch.update(doc(db, "chats", c.id), { [`photos.${uid}`]: photo });
    }
    await batch.commit();
  } catch {}
}

/** When a thread opens, refresh both sides' photos (mine + peer lookup). */
export async function healChatPhotos(
  chatId: string,
  meUid: string,
  mePhoto: string | null,
  peerUid: string
): Promise<void> {
  if (noDb() || !peerUid) return;
  try {
    let peerPhoto: string | null = null;
    try {
      const snap = await getDocs(query(collection(db, "usernames"), where("uid", "==", peerUid), limit(1)));
      snap.forEach((d) => {
        peerPhoto = (d.data().photoURL as string) ?? null;
      });
    } catch {}
    await updateDoc(doc(db, "chats", chatId), {
      [`photos.${meUid}`]: mePhoto,
      [`photos.${peerUid}`]: peerPhoto,
    });
  } catch {}
}
