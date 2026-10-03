import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Username system on top of Firebase email/password auth.
 *
 * - usernames/{lowercased}  ->  { uid, email, username }
 *     Publicly readable so login can resolve a username to its email.
 *     Created atomically, so the doc itself is the uniqueness lock.
 * - users/{uid}             ->  { username, email, created_at }
 *     The user's private profile.
 */

export const MIN_USERNAME = 5;
export const MAX_USERNAME = 15;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

/** Returns an error string if invalid, or null if the username is OK. */
export function validateUsername(raw: string): string | null {
  const u = (raw || "").trim();
  if (u.length < MIN_USERNAME)
    return `Username must be at least ${MIN_USERNAME} characters.`;
  if (u.length > MAX_USERNAME)
    return `Username must be at most ${MAX_USERNAME} characters.`;
  if (!USERNAME_RE.test(u))
    return "Use only letters, numbers and underscores.";
  return null;
}

export function validateEmail(raw: string): string | null {
  const e = (raw || "").trim();
  if (!e) return "Enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "That email doesn't look right.";
  return null;
}

export function validatePassword(raw: string): string | null {
  if (!raw || raw.length < 8) return "Password must be at least 8 characters.";
  return null;
}

const key = (username: string) => username.trim().toLowerCase();

/** Look up the email behind a username (used to sign in by username). */
export async function resolveUsernameToEmail(
  username: string
): Promise<string | null> {
  const snap = await getDoc(doc(db, "usernames", key(username)));
  return snap.exists() ? ((snap.data().email as string) ?? null) : null;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "usernames", key(username)));
  return !snap.exists();
}

export type FoundUser = { username: string; uid: string; photoURL?: string | null };

/** Prefix-search usernames (doc ids are lowercased usernames). */
export async function searchUsernames(q: string, max = 10): Promise<FoundUser[]> {
  const prefix = q.trim().toLowerCase();
  if (!prefix) return [];
  const snap = await getDocs(
    query(
      collection(db, "usernames"),
      where(documentId(), ">=", prefix),
      where(documentId(), "<=", prefix + "\uf8ff"),
      limit(max)
    )
  );
  const out: FoundUser[] = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.username && data.uid) {
      out.push({
        username: data.username as string,
        uid: data.uid as string,
        photoURL: (data.photoURL as string) ?? null,
      });
    }
  });
  return out;
}

/** uid behind a username (null if missing). */
export async function resolveUsernameToUid(username: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "usernames", key(username)));
  return snap.exists() ? ((snap.data().uid as string) ?? null) : null;
}

export type Profile = {
  username?: string;
  email?: string;
  photoURL?: string | null;
};

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as Profile) : null;
}

/**
 * Atomically claim a username for a user. Throws if it's already taken.
 * Writes both the public mapping and the user's profile in one transaction.
 */
export async function claimUsername(
  uid: string,
  email: string,
  usernameRaw: string
): Promise<void> {
  const username = usernameRaw.trim();
  const err = validateUsername(username);
  if (err) throw new Error(err);

  const unameRef = doc(db, "usernames", key(username));
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(unameRef);
    if (existing.exists()) throw new Error("This username is already taken.");
    tx.set(unameRef, { uid, email, username, photoURL: null });
    tx.set(
      userRef,
      { username, email, created_at: serverTimestamp() },
      { merge: true }
    );
  });
}

/**
 * Change username: claims the new one, frees the old one, updates the
 * profile — atomically. Throws if the new name is taken.
 */
export async function changeUsername(
  uid: string,
  oldRaw: string,
  newRaw: string
): Promise<void> {
  const next = newRaw.trim();
  const err = validateUsername(next);
  if (err) throw new Error(err);
  const oldKey = key(oldRaw);
  const newKey = key(next);
  if (oldKey === newKey) return;

  const userSnap = await getDoc(doc(db, "users", uid));
  const userData = userSnap.data();
  const email = (userData?.email as string) ?? "";
  const photo = (userData?.photoURL as string) ?? null;

  await runTransaction(db, async (tx) => {
    const taken = await tx.get(doc(db, "usernames", newKey));
    if (taken.exists()) throw new Error("This username is already taken.");
    tx.set(doc(db, "usernames", newKey), { uid, email, username: next, photoURL: photo });
    tx.delete(doc(db, "usernames", oldKey));
    tx.update(doc(db, "users", uid), { username: next });
  });
}

/** Set profile picture (key of a bundled avatar). Mirrors into the public username doc. */
export async function updatePhoto(uid: string, username: string, photo: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { photoURL: photo });
  if (username.trim()) {
    await updateDoc(doc(db, "usernames", key(username)), { photoURL: photo }).catch(() => {});
  }
}
