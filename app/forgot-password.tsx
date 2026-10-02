import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authErrorMessage, useAuth } from "../lib/auth";
import { AuthButton, AuthError, AuthInput, AuthLink, AuthShell } from "../components/AuthUI";

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSend() {
    setError("");
    if (!email.trim()) return setError("Email likho.");
    setBusy(true);
    try {
      await resetPassword(email);
      setDone(true);
    } catch (e) {
      setError(authErrorMessage(e));
    }
    setBusy(false);
  }

  return (
    <AuthShell>
      <View style={{ height: insets.top }} />
      <Text style={s.brand}>Password reset</Text>
      <Text style={s.sub}>Email daalo, reset link bhejenge.</Text>
      {done ? (
        <Text style={s.ok}>Link bhej diya. Email ka inbox (aur spam) check karo, phir wapas login karo.</Text>
      ) : (
        <>
          <AuthInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
          <AuthError msg={error} />
          <AuthButton title="Reset Link Bhejo" onPress={onSend} busy={busy} />
        </>
      )}
      <AuthLink label="Wapas login pe jao" onPress={() => router.replace("/login")} />
    </AuthShell>
  );
}

const s = StyleSheet.create({
  brand: { color: "#fff", fontSize: 30, fontWeight: "900", textAlign: "center" },
  sub: { color: "#888", textAlign: "center", marginBottom: 12 },
  ok: { color: "#4caf7d", textAlign: "center", lineHeight: 20 },
});
