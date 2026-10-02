import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Song } from "../lib/music";
import { usePlayer } from "../lib/player";
import { AddToPlaylistModal } from "./AddToPlaylistModal";

export function SongRow({
  song,
  queue,
  index,
  onRemove,
}: {
  song: Song;
  queue: Song[];
  index?: number;
  onRemove?: () => void;
}) {
  const { play, current, isPlaying, toggleLike, isLiked } = usePlayer();
  const [plOpen, setPlOpen] = useState(false);
  const active = current?.id === song.id;
  const liked = isLiked(song.id);

  return (
    <>
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
          <Ionicons name="stats-chart" size={18} color="#BC8CF2" />
        ) : null}
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={10} style={s.icon}>
            <Ionicons name="remove-circle-outline" size={20} color="#888" />
          </Pressable>
        ) : (
          <>
            <Pressable onPress={() => toggleLike(song)} hitSlop={10} style={s.icon}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#BC8CF2" : "#888"} />
            </Pressable>
            <Pressable onPress={() => setPlOpen(true)} hitSlop={10} style={s.icon}>
              <Ionicons name="list-outline" size={20} color="#888" />
            </Pressable>
          </>
        )}
      </Pressable>
      <AddToPlaylistModal visible={plOpen} song={song} onClose={() => setPlOpen(false)} />
    </>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 10 },
  active: { backgroundColor: "rgba(188,140,242,0.08)" },
  art: { width: 52, height: 52, borderRadius: 6, backgroundColor: "#222" },
  mid: { flex: 1 },
  title: { color: "#fff", fontSize: 15, fontWeight: "600" },
  activeText: { color: "#BC8CF2" },
  sub: { color: "#999", fontSize: 13, marginTop: 2 },
  icon: { padding: 6 },
});
