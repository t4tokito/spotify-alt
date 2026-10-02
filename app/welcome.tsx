import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthBg, AuthBrand, AuthButton, AuthSecondaryButton } from "../components/AuthUI";

const FEATS = [
  { icon: "ban-outline", label: "No ads" },
  { icon: "musical-note-outline", label: "320kbps" },
  { icon: "infinite-outline", label: "Unlimited" },
  { icon: "list-outline", label: "Playlists" },
] as const;

export default function Welcome() {
  const router = useRouter();
  return (
    <AuthBg>
      <View style={s.block}>
        <AuthBrand />
        <View style={s.feats}>
          {FEATS.map((f) => (
            <View key={f.label} style={s.feat}>
              <View style={s.featIcon}>
                <Ionicons name={f.icon as any} size={18} color="#1DB954" />
              </View>
              <Text style={s.featText}>{f.label}</Text>
            </View>
          ))}
        </View>
        <View style={s.btns}>
          <AuthButton title="SIGN UP" onPress={() => router.push("/signup")} />
          <AuthSecondaryButton title="LOG IN" onPress={() => router.push("/login")} />
        </View>
      </View>
    </AuthBg>
  );
}

const s = StyleSheet.create({
  block: { gap: 20, marginBottom: 44 },
  btns: { gap: 12 },
  feats: { flexDirection: "row", justifyContent: "space-evenly", paddingVertical: 4 },
  feat: { alignItems: "center", gap: 6 },
  featIcon: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "rgba(29,185,84,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  featText: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700" },
});
