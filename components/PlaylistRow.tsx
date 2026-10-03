import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Playlist } from "../lib/playlists";
import { PLAYLIST_ICONS } from "../lib/playlistIcons";
import { C } from "../lib/theme";

export function PlaylistRow({ pl }: { pl: Playlist }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/playlist/${pl.id}` as any)}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}
    >
      <View style={s.art}>
        {pl.icon && PLAYLIST_ICONS[pl.icon] ? (
          <Image source={PLAYLIST_ICONS[pl.icon]} style={s.artImg} />
        ) : (
          <Ionicons name="musical-notes" size={22} color={C.accent} />
        )}
      </View>
      <View style={s.mid}>
        <Text numberOfLines={1} style={s.name}>{pl.name}</Text>
        <Text style={s.sub}>{pl.songs.length} songs</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={C.neutral} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 12 },
  art: { width: 52, height: 52, borderRadius: 12, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  artImg: { width: 52, height: 52, borderRadius: 12 },
  mid: { flex: 1 },
  name: { color: C.text, fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  sub: { color: C.textDim, fontSize: 13, marginTop: 2 },
});
