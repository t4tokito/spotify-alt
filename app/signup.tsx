import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { authErrorMessage, useAuth } from "../lib/auth";
import { isUsernameAvailable, validateEmail, validatePassword, validateUsername } from "../lib/usernames";
import { AuthBg, AuthButton, AuthError, AuthHeading, AuthHint, AuthInput, AuthLink } from "../components/AuthUI";

export default function Signup() {
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
        setNameStatus((await isUsernameAvailable(u)) ? "This username is available." : "This username is already taken.");
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
    <AuthBg>
      <View style={{ flex: 1, paddingTop: 40 }}>
        <AuthHeading title="SIGN UP" sub="Never Lost. Discover New Music." />
      </View>
      <AuthInput value={username} onChangeText={setUsername} placeholder="Username (5-15 characters)" />
      <AuthHint msg={nameStatus} ok={nameStatus.includes("available")} />
      <AuthInput value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" />
      <AuthInput value={password} onChangeText={setPassword} placeholder="Password (min 8 characters)" secure />
      <AuthError msg={error} />
      <AuthButton title="CREATE ACCOUNT" onPress={onSignup} busy={busy} />
      <View style={s.row}>
        <Text style={s.muted}>Already have an account? </Text>
        <AuthLink label="Log in" onPress={() => router.replace("/login")} />
      </View>
    </AuthBg>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  muted: { color: "rgba(255,255,255,0.7)" },
});
