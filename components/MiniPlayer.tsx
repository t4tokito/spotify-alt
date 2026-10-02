import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../lib/player";

export function MiniPlayer() {
  const { current, isPlaying, toggle, next } = usePlayer();
  const router = useRouter();
  if (!current) return null;

  return (
    <Pressable onPress={() => router.push("/player")} style={s.wrap}>
      <Image source={{ uri: current.imageSmall || current.image }} style={s.art} />
      <View style={s.mid}>
        <Text numberOfLines={1} style={s.title}>{current.name}</Text>
        <Text numberOfLines={1} style={s.sub}>{current.artists}</Text>
      </View>
      <Pressable onPress={toggle} hitSlop={12} style={s.btn}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
      </Pressable>
      <Pressable onPress={next} hitSlop={12} style={s.btn}>
        <Ionicons name="play-forward" size={22} color="#fff" />
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#2a2a2a", marginHorizontal: 10, marginBottom: 8,
    borderRadius: 10, padding: 8, gap: 10,
  },
  art: { width: 46, height: 46, borderRadius: 6, backgroundColor: "#333" },
  mid: { flex: 1 },
  title: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sub: { color: "#aaa", fontSize: 12, marginTop: 1 },
  btn: { padding: 6 },
});
