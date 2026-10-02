import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { authErrorMessage, useAuth } from "../lib/auth";
import { AuthBg, AuthButton, AuthError, AuthHeading, AuthInput, AuthLink } from "../components/AuthUI";

export default function ForgotPassword() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSend() {
    setError("");
    if (!email.trim()) return setError("Enter your email.");
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
    <AuthBg>
      <View style={{ flex: 1, paddingTop: 40 }}>
        <AuthHeading title="RESET PASSWORD" sub="Enter your email, we'll send a reset link." />
      </View>
      {done ? (
        <Text style={s.ok}>Link sent. Check your inbox (and spam folder), then log in.</Text>
      ) : (
        <>
          <AuthInput value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" />
          <AuthError msg={error} />
          <AuthButton title="SEND RESET LINK" onPress={onSend} busy={busy} />
        </>
      )}
      <AuthLink label="Back to login" onPress={() => router.replace("/login")} />
    </AuthBg>
  );
}

const s = StyleSheet.create({
  ok: { color: "#7ddba3", textAlign: "center", lineHeight: 20 },
});
