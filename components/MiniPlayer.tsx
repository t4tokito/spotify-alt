import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../lib/player";
import { C } from "../lib/theme";

export function MiniPlayer() {
  const { current, isPlaying, toggle, next } = usePlayer();
  const router = useRouter();
  if (!current) return null;

  return (
    <View style={s.float}>
      <BlurView intensity={70} tint="dark" style={s.blur}>
        <Pressable
          onPress={() => router.push("/player")}
          style={({ pressed }) => [s.wrap, pressed && { opacity: 0.7 }]}
        >
          <Image source={{ uri: current.imageSmall || current.image }} style={s.art} />
          <View style={s.mid}>
            <Text numberOfLines={1} style={s.title}>{current.name}</Text>
            <Text numberOfLines={1} style={s.sub}>{current.artists}</Text>
          </View>
          <Pressable onPress={toggle} hitSlop={12} style={s.btn}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={C.text} />
          </Pressable>
          <Pressable onPress={next} hitSlop={12} style={s.btn}>
            <Ionicons name="play-forward" size={22} color={C.text} />
          </Pressable>
        </Pressable>
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  float: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(28,28,31,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  blur: { borderRadius: 18 },
  wrap: { flexDirection: "row", alignItems: "center", padding: 10, gap: 10 },
  art: { width: 48, height: 48, borderRadius: 11, backgroundColor: "#333" },
  mid: { flex: 1 },
  title: { color: C.text, fontWeight: "700", fontSize: 14, letterSpacing: -0.2 },
  sub: { color: C.textDim, fontSize: 12, marginTop: 1 },
  btn: { padding: 6 },
});
