import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { authErrorMessage, useAuth } from "../lib/auth";
import { FIREBASE_CONFIGURED } from "../lib/firebase";
import { AuthBg, AuthButton, AuthError, AuthHeading, AuthInput, AuthLink } from "../components/AuthUI";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLogin() {
    setError("");
    if (!identifier.trim()) return setError("Enter your email or username.");
    if (!password) return setError("Enter your password.");
    setBusy(true);
    try {
      await signIn(identifier, password);
      router.replace("/");
    } catch (e) {
      setError(authErrorMessage(e));
    }
    setBusy(false);
  }

  return (
    <AuthBg>
      <View style={{ flex: 1, paddingTop: 40 }}>
        <AuthHeading title="LOG IN" sub="Never Lost. Discover New Music." />
      </View>
      {!FIREBASE_CONFIGURED && (
        <Text style={s.warn}>Firebase keys are missing — add EXPO_PUBLIC_FIREBASE_* to .env and restart the app.</Text>
      )}
      <AuthInput value={identifier} onChangeText={setIdentifier} placeholder="Email or username" keyboardType="email-address" />
      <AuthInput value={password} onChangeText={setPassword} placeholder="Password" secure />
      <AuthError msg={error} />
      <AuthButton title="LOG IN" onPress={onLogin} busy={busy} />
      <AuthLink label="Forgot password?" onPress={() => router.push("/forgot-password")} />
      <View style={s.row}>
        <Text style={s.muted}>No account yet? </Text>
        <AuthLink label="Sign up" onPress={() => router.push("/signup")} />
      </View>
    </AuthBg>
  );
}

const s = StyleSheet.create({
  warn: { color: "#ffcf9d", fontSize: 13, textAlign: "center", lineHeight: 18 },
  row: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  muted: { color: "rgba(255,255,255,0.7)" },
});
