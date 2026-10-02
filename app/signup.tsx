import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authErrorMessage, useAuth } from "../lib/auth";
import { isUsernameAvailable, validateEmail, validatePassword, validateUsername } from "../lib/usernames";
import { AuthButton, AuthError, AuthHint, AuthInput, AuthLink, AuthShell } from "../components/AuthUI";

export default function Signup() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [nameStatus, setNameStatus] = useState("");

  // live username availability (debounced)
  useEffect(() => {
    const u = username.trim();
    if (!u) return setNameStatus("");
    const err = validateUsername(u);
    if (err) return setNameStatus(err);
    setNameStatus("Checking...");
    const t = setTimeout(async () => {
      try {
        setNameStatus((await isUsernameAvailable(u)) ? "Ye username available hai." : "Ye username already taken hai.");
      } catch {
        setNameStatus("");
      }
    }, 600);
    return () => clearTimeout(t);
  }, [username]);

  async function onSignup() {
    setError("");
    const uErr = validateUsername(username);
    if (uErr) return setError(uErr);
    const eErr = validateEmail(email);
    if (eErr) return setError(eErr);
    const pErr = validatePassword(password);
    if (pErr) return setError(pErr);
    setBusy(true);
    try {
      await signUp(email, username, password);
      router.replace("/");
    } catch (e) {
      setError(authErrorMessage(e));
    }
    setBusy(false);
  }

  return (
    <AuthShell>
      <View style={{ height: insets.top }} />
      <Text style={s.brand}>Account banao</Text>
      <Text style={s.sub}>Username • Email • Password</Text>
      <AuthInput value={username} onChangeText={setUsername} placeholder="Username (5-15 letters)" />
      <AuthHint msg={nameStatus} ok={nameStatus.includes("available")} />
      <AuthInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
      <AuthInput value={password} onChangeText={setPassword} placeholder="Password (min 8 letters)" secure />
      <AuthError msg={error} />
      <AuthButton title="Sign Up" onPress={onSignup} busy={busy} />
      <View style={s.row}>
        <Text style={s.muted}>Already account hai? </Text>
        <AuthLink label="Log in karo" onPress={() => router.replace("/login")} />
      </View>
    </AuthShell>
  );
}

const s = StyleSheet.create({
  brand: { color: "#fff", fontSize: 30, fontWeight: "900", textAlign: "center" },
  sub: { color: "#888", textAlign: "center", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  muted: { color: "#888" },
});
