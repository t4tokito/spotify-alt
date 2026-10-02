import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { FIREBASE_CONFIGURED, auth } from "./firebase";
import {
  claimUsername,
  getProfile,
  isUsernameAvailable,
  resolveUsernameToEmail,
  validateEmail,
  validatePassword,
  validateUsername,
  type Profile,
} from "./usernames";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  initializing: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function ensureConfigured() {
  if (!FIREBASE_CONFIGURED) {
    throw new Error("Firebase setup missing hai. .env me keys daalo.");
  }
}

export function authErrorMessage(e: any): string {
  const code = e?.code as string | undefined;
  switch (code) {
    case "auth/invalid-email":
      return "Ye email sahi nahi lag raha.";
    case "auth/missing-password":
      return "Password likho.";
    case "auth/weak-password":
      return "Password kam se kam 8 characters ka ho.";
    case "auth/email-already-in-use":
      return "Is email se account already bana hai. Login karo.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Username/email ya password galat hai.";
    case "auth/too-many-requests":
      return "Bahut saari koshish. Thodi der baad try karo.";
    case "auth/network-request-failed":
      return "Network error. Connection check karo.";
    default:
      return e?.message || "Kuch galat ho gaya.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) {
      setInitializing(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          setProfile(await getProfile(u.uid));
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setInitializing(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      initializing,
      signIn: async (identifier, password) => {
        ensureConfigured();
        let email = identifier.trim();
        if (!email.includes("@")) {
          const resolved = await resolveUsernameToEmail(email);
          if (!resolved) throw { code: "auth/user-not-found" };
          email = resolved;
        }
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUp: async (email, username, password) => {
        ensureConfigured();
        const e = email.trim();
        const u = username.trim();
        const emailErr = validateEmail(e);
        if (emailErr) throw new Error(emailErr);
        const userErr = validateUsername(u);
        if (userErr) throw new Error(userErr);
        const passErr = validatePassword(password);
        if (passErr) throw new Error(passErr);
        const available = await isUsernameAvailable(u);
        if (!available) throw new Error("Ye username already taken hai.");

        const cred = await createUserWithEmailAndPassword(auth, e, password);
        try {
          await claimUsername(cred.user.uid, e, u);
          setProfile({ username: u, email: e });
        } catch (err) {
          await cred.user.delete().catch(() => {});
          throw err;
        }
      },
      resetPassword: async (email) => {
        ensureConfigured();
        const e = email.trim();
        const emailErr = validateEmail(e);
        if (emailErr) throw new Error(emailErr);
        await sendPasswordResetEmail(auth, e);
      },
      signOut: () => fbSignOut(auth),
    }),
    [user, profile, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
