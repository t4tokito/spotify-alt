import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export const MAROON = "#790D16";

export function AuthInput({
  value,
  onChangeText,
  placeholder,
  secure = false,
  autoCapitalize = "none",
  keyboardType = "default",
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secure?: boolean;
  autoCapitalize?: "none" | "words";
  keyboardType?: "default" | "email-address";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#777"
      secureTextEntry={secure}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      style={s.input}
    />
  );
}

export function AuthButton({
  title,
  onPress,
  busy,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={busy} style={[s.btn, busy && s.btnBusy]}>
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{title}</Text>}
    </Pressable>
  );
}

export function AuthError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <Text style={s.error}>{msg}</Text>;
}

export function AuthHint({ msg, ok }: { msg: string; ok?: boolean }) {
  if (!msg) return null;
  return <Text style={[s.hint, ok && s.hintOk]}>{msg}</Text>;
}

export function AuthLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={s.link}>{label}</Text>
    </Pressable>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <View style={s.shell}>{children}</View>;
}

const s = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#121212", padding: 24, justifyContent: "center", gap: 12 },
  input: {
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#fff",
  },
  btn: { backgroundColor: MAROON, borderRadius: 24, paddingVertical: 15, alignItems: "center", marginTop: 6 },
  btnBusy: { opacity: 0.7 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  error: { color: "#ff8080", fontSize: 13, lineHeight: 18 },
  hint: { color: "#888", fontSize: 13 },
  hintOk: { color: "#4caf7d" },
  link: { color: "#fff", fontWeight: "700", textDecorationLine: "underline", textAlign: "center" },
});
