import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Song } from "../lib/music";
import { usePlayer } from "../lib/player";
import { C, tint } from "../lib/theme";
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
      <Pressable
        onPress={() => play(song, queue)}
        style={({ pressed }) => [s.row, active && s.active, pressed && { opacity: 0.6 }]}
      >
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
          <Ionicons name="stats-chart" size={18} color={C.accent} />
        ) : null}
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={10} style={s.icon}>
            <Ionicons name="remove-circle-outline" size={20} color={C.neutral} />
          </Pressable>
        ) : (
          <>
            <Pressable onPress={() => toggleLike(song)} hitSlop={10} style={s.icon}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? C.like : C.neutral} />
            </Pressable>
            <Pressable onPress={() => setPlOpen(true)} hitSlop={10} style={s.icon}>
              <Ionicons name="list-outline" size={20} color={C.neutral} />
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
  active: { backgroundColor: tint(C.accent, 0.09) },
  art: { width: 52, height: 52, borderRadius: 11, backgroundColor: C.surface },
  mid: { flex: 1 },
  title: { color: C.text, fontSize: 15, fontWeight: "600", letterSpacing: -0.2 },
  activeText: { color: C.accent },
  sub: { color: C.textDim, fontSize: 13, marginTop: 2 },
  icon: { padding: 6 },
});
