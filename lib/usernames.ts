import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
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

export type Profile = {
  username?: string;
  email?: string;
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
    tx.set(unameRef, { uid, email, username });
    tx.set(
      userRef,
      { username, email, created_at: serverTimestamp() },
      { merge: true }
    );
  });
}
