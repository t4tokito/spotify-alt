import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authErrorMessage, useAuth } from "../lib/auth";
import { FIREBASE_CONFIGURED } from "../lib/firebase";
import { AuthButton, AuthError, AuthInput, AuthLink, AuthShell } from "../components/AuthUI";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLogin() {
    setError("");
    if (!identifier.trim()) return setError("Email ya username likho.");
    if (!password) return setError("Password likho.");
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
    <AuthShell>
      <View style={{ height: insets.top }} />
      <Text style={s.brand}>Tokito Music</Text>
      <Text style={s.sub}>100% Free • No Ads</Text>
      {!FIREBASE_CONFIGURED && (
        <Text style={s.warn}>Firebase keys missing hai — .env me EXPO_PUBLIC_FIREBASE_* daalo aur app restart karo.</Text>
      )}
      <AuthInput value={identifier} onChangeText={setIdentifier} placeholder="Email ya username" keyboardType="email-address" />
      <AuthInput value={password} onChangeText={setPassword} placeholder="Password" secure />
      <AuthError msg={error} />
      <AuthButton title="Log In" onPress={onLogin} busy={busy} />
      <AuthLink label="Password bhool gaye?" onPress={() => router.push("/forgot-password")} />
      <View style={s.row}>
        <Text style={s.muted}>Account nahi hai? </Text>
        <AuthLink label="Sign up karo" onPress={() => router.push("/signup")} />
      </View>
    </AuthShell>
  );
}

const s = StyleSheet.create({
  brand: { color: "#fff", fontSize: 36, fontWeight: "900", textAlign: "center" },
  sub: { color: "#888", textAlign: "center", marginBottom: 12 },
  warn: { color: "#ffb74d", fontSize: 13, textAlign: "center", lineHeight: 18 },
  row: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  muted: { color: "#888" },
});
