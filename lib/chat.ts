import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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
  const snap = await getDoc(ref);
  if (!snap.exists()) {
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

export function subscribeMessages(chatId: string, cb: (msgs: ChatMsg[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "chats", chatId, "messages"), orderBy("at", "asc")),
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
      cb(out);
    },
    () => {}
  );
}

async function pushMessage(chatId: string, msg: Record<string, unknown>, preview: string): Promise<void> {
  const ref = doc(collection(db, "chats", chatId, "messages"));
  await setDoc(ref, { ...msg, at: Date.now() });
  await updateDoc(doc(db, "chats", chatId), { lastText: preview.slice(0, 80), updatedAt: Date.now() }).catch(
    () => {}
  );
}

export async function sendText(
  chatId: string,
  from: { uid: string; username: string },
  text: string
): Promise<void> {
  const t = text.trim();
  if (!t) return;
  await pushMessage(
    chatId,
    { from: from.uid, fromName: from.username, kind: "text", text: t, createdAt: serverTimestamp() },
    t
  );
}

export async function sendSong(
  chatId: string,
  from: { uid: string; username: string },
  song: Song
): Promise<void> {
  await pushMessage(
    chatId,
    { from: from.uid, fromName: from.username, kind: "song", song: JSON.parse(JSON.stringify(song)), createdAt: serverTimestamp() },
    `Song: ${song.name}`
  );
}

export async function sendPlaylist(
  chatId: string,
  from: { uid: string; username: string },
  pl: { id: string; ownerUid: string; name: string; songCount: number }
): Promise<void> {
  await pushMessage(
    chatId,
    { from: from.uid, fromName: from.username, kind: "playlist", playlist: pl, createdAt: serverTimestamp() },
    `Playlist: ${pl.name}`
  );
}

export function peerOf(chat: ChatDoc, meUid: string): { uid: string; username: string; photoURL?: string | null } {
  const uid = chat.participants.find((p) => p !== meUid) ?? meUid;
  return { uid, username: chat.names?.[uid] ?? "Unknown", photoURL: chat.photos?.[uid] ?? null };
}
