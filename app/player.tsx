import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "../lib/player";
import { formatTime } from "../lib/saavn";

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { current, isPlaying, toggle, next, prev, position, duration, seek, toggleLike, isLiked, loading } = usePlayer();

  if (!current) {
    return (
      <View style={[s.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#888" }}>Koi gaana play nahi ho raha</Text>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={{ color: "#fff" }}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const liked = isLiked(current.id);
  const progress = duration > 0 ? position / duration : 0;

  return (
    <LinearGradient colors={["#1DB95444", "#121212"]} style={[s.root, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} style={s.down} hitSlop={12}>
        <Ionicons name="chevron-down" size={30} color="#fff" />
      </Pressable>
      <Image source={{ uri: current.image }} style={s.art} />
      <View style={s.infoRow}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={s.title}>{current.name}</Text>
          <Text numberOfLines={1} style={s.artist}>{current.artists}</Text>
        </View>
        <Pressable onPress={() => toggleLike(current)} hitSlop={10}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? "#1DB954" : "#fff"} />
        </Pressable>
      </View>

      <View style={s.barWrap}>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
        </View>
        <View style={s.times}>
          <Text style={s.time}>{formatTime(position)}</Text>
          <Text style={s.time}>{formatTime(duration)}</Text>
        </View>
        <View style={s.seekRow}>
          <Pressable onPress={() => seek(Math.max(0, position - 10))} style={s.skip}>
            <Text style={s.skipText}>-10s</Text>
          </Pressable>
          <Pressable onPress={() => seek(Math.min(duration, position + 10))} style={s.skip}>
            <Text style={s.skipText}>+10s</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.controls}>
        <Pressable onPress={prev} hitSlop={14}>
          <Ionicons name="play-skip-back" size={40} color="#fff" />
        </Pressable>
        <Pressable onPress={toggle} style={s.playBtn} hitSlop={10}>
          {loading ? (
            <ActivityIndicator color="#000" size="large" />
          ) : (
            <Ionicons name={isPlaying ? "pause" : "play"} size={42} color="#000" />
          )}
        </Pressable>
        <Pressable onPress={next} hitSlop={14}>
          <Ionicons name="play-skip-forward" size={40} color="#fff" />
        </Pressable>
      </View>

      <Text style={s.free}>Tokito Music • Free Forever • No Ads • {current.language} • {current.year}</Text>
      <View style={{ height: insets.bottom + 10 }} />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  down: { alignSelf: "flex-start", padding: 4 },
  art: { width: "100%", aspectRatio: 1, borderRadius: 12, marginTop: 18, backgroundColor: "#222" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 24, gap: 12 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900" },
  artist: { color: "#aaa", fontSize: 15, marginTop: 4 },
  barWrap: { marginTop: 20 },
  barBg: { height: 5, backgroundColor: "#333", borderRadius: 3, overflow: "hidden" },
  barFill: { height: 5, backgroundColor: "#1DB954" },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  time: { color: "#888", fontSize: 12 },
  seekRow: { flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 6 },
  skip: { padding: 6 },
  skipText: { color: "#1DB954", fontWeight: "700" },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 36, marginTop: 22 },
  playBtn: { backgroundColor: "#fff", width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  free: { color: "#666", textAlign: "center", marginTop: 26, fontSize: 12 },
  backBtn: { marginTop: 16, backgroundColor: "#1DB954", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
});
