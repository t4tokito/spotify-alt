import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Song } from "../lib/music";
import { usePlayer } from "../lib/player";

export function SongRow({ song, queue, index }: { song: Song; queue: Song[]; index?: number }) {
  const { play, current, isPlaying, toggleLike, isLiked } = usePlayer();
  const active = current?.id === song.id;
  const liked = isLiked(song.id);

  return (
    <Pressable onPress={() => play(song, queue)} style={[s.row, active && s.active]}>
      <Image source={{ uri: song.imageSmall || song.image }} style={s.art} />
      <View style={s.mid}>
        <Text numberOfLines={1} style={[s.title, active && s.activeText]}>
          {song.name}
        </Text>
        <Text numberOfLines={1} style={s.sub}>
          {song.artists}
        </Text>
      </View>
      {active && isPlaying ? (
        <Ionicons name="stats-chart" size={18} color="#790D16" />
      ) : null}
      <Pressable onPress={() => toggleLike(song)} hitSlop={10} style={s.like}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#790D16" : "#888"} />
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 12 },
  active: { backgroundColor: "rgba(29,185,84,0.08)" },
  art: { width: 52, height: 52, borderRadius: 6, backgroundColor: "#222" },
  mid: { flex: 1 },
  title: { color: "#fff", fontSize: 15, fontWeight: "600" },
  activeText: { color: "#790D16" },
  sub: { color: "#999", fontSize: 13, marginTop: 2 },
  like: { padding: 6 },
});
