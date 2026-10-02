import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ACCENT = "#BC8CF2";
const ON_ACCENT = "#141414";
const BG = require("../assets/login.jpeg");

/** Full-screen photo background with dark overlay (auth screens). */
export function AuthBg({ children, center }: { children: React.ReactNode; center?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground source={BG} style={s.bg} resizeMode="cover">
      <View style={s.overlay} />
      <LinearGradient
        colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.32)", "rgba(0,0,0,0.78)"]}
        style={s.gradient}
      />
      <View style={[s.content, center && s.centered, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}>
        {children}
      </View>
    </ImageBackground>
  );
}

/** Brand mark: maroon disc with music note + big two-line name. */
export function AuthBrand({ tagline = "Never Lost. Discover New Music." }: { tagline?: string }) {
  return (
    <View>
        <View style={s.disc}>
          <Ionicons name="musical-note" size={30} color={ON_ACCENT} />
        </View>
      <Text style={s.brandName}>Tokito{"\n"}Music</Text>
      <Text style={s.tagline}>{tagline}</Text>
    </View>
  );
}

export function AuthHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <View>
      <Text style={s.heading}>{title}</Text>
      {sub ? <Text style={s.headingSub}>{sub}</Text> : null}
    </View>
  );
}

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
      placeholderTextColor="#999"
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
      {busy ? <ActivityIndicator color={ON_ACCENT} /> : <Text style={s.btnText}>{title}</Text>}
    </Pressable>
  );
}

export function AuthSecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.btnDark}>
      <Text style={s.btnDarkText}>{title}</Text>
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

const s = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.22)" },
  gradient: { ...StyleSheet.absoluteFill },
  content: { flex: 1, paddingHorizontal: 24, gap: 12, justifyContent: "flex-end" },
  centered: { justifyContent: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  disc: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: ACCENT, alignItems: "center", justifyContent: "center",
  },
  brandName: { color: "#fff", fontSize: 68, fontWeight: "900", lineHeight: 72, marginTop: 14 },
  tagline: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 8 },
  heading: { color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: 1 },
  headingSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
  input: {
    backgroundColor: "rgba(18,18,18,0.45)",
    borderRadius: 12,
    padding: 18,
    fontSize: 16,
    color: "#fff",
  },
  btn: { backgroundColor: ACCENT, borderRadius: 28, paddingVertical: 16, alignItems: "center", marginTop: 6 },
  btnDark: { backgroundColor: "rgba(20,20,20,0.85)", borderRadius: 28, paddingVertical: 16, alignItems: "center" },
  btnBusy: { opacity: 0.7 },
  btnText: { color: ON_ACCENT, fontWeight: "800", fontSize: 15, letterSpacing: 1 },
  btnDarkText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 1 },
  error: { color: "#ff9d9d", fontSize: 13, lineHeight: 18 },
  hint: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  hintOk: { color: "#7ddba3" },
  link: { color: "#fff", fontWeight: "700", textDecorationLine: "underline", textAlign: "center" },
});
