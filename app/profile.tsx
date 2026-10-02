import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth";
import { usePlayer } from "../lib/player";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { profile, user, signOut } = useAuth();
  const { liked, history } = usePlayer();
  const likedCount = Object.keys(liked).length;
  const name = profile?.username ?? "Music Lover";
  const initial = (name.trim()[0] ?? "M").toUpperCase();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Text style={s.title}>Profile</Text>
      <View style={s.card}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <Text style={s.name}>{name}</Text>
        <Text style={s.email}>{profile?.email ?? user?.email ?? ""}</Text>
      </View>
      <View style={s.stats}>
        <View style={s.stat}>
          <Ionicons name="heart" size={20} color="#790D16" />
          <Text style={s.statNum}>{likedCount}</Text>
          <Text style={s.statLabel}>Liked</Text>
        </View>
        <View style={s.stat}>
          <Ionicons name="time-outline" size={20} color="#790D16" />
          <Text style={s.statNum}>{history.length}</Text>
          <Text style={s.statLabel}>Played</Text>
        </View>
      </View>
      <Pressable onPress={signOut} style={s.outBtn}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={s.outText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#121212", paddingHorizontal: 16 },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 16 },
  card: { backgroundColor: "#1e1e1e", borderRadius: 14, padding: 24, alignItems: "center" },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: "#790D16", alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 34, fontWeight: "900" },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 12 },
  email: { color: "#888", marginTop: 4 },
  stats: { flexDirection: "row", gap: 12, marginTop: 12 },
  stat: { flex: 1, backgroundColor: "#1e1e1e", borderRadius: 14, padding: 16, alignItems: "center", gap: 4 },
  statNum: { color: "#fff", fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#888", fontSize: 12 },
  outBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#790D16", borderRadius: 24, paddingVertical: 14, marginTop: 20,
  },
  outText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
