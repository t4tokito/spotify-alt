import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Playlist } from "../lib/playlists";
import { PLAYLIST_ICONS } from "../lib/playlistIcons";
import { usePlayer } from "../lib/player";
import { C } from "../lib/theme";

export function SpotlightCard({ pl, ownerUid }: { pl: Playlist; ownerUid?: string }) {
  const router = useRouter();
  const { play } = usePlayer();
  const href = ownerUid ? `/playlist/${pl.id}?owner=${ownerUid}` : `/playlist/${pl.id}`;
  const vis = pl.visibility ?? "private";

  return (
    <Pressable
      onPress={() => router.push(href as any)}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] }]}
    >
      {pl.icon && PLAYLIST_ICONS[pl.icon] ? (
        <Image source={PLAYLIST_ICONS[pl.icon]} resizeMode="cover" style={s.art} />
      ) : pl.songs?.[0]?.image ? (
        <Image source={{ uri: pl.songs[0].image }} style={s.art} />
      ) : (
        <View style={[s.art, s.empty]}>
          <Ionicons name="musical-notes" size={30} color={C.accent} />
        </View>
      )}
      <View style={s.mid}>
        <Text numberOfLines={1} style={s.name}>{pl.name}</Text>
        <Text style={s.sub}>{pl.songs.length} songs</Text>
        <View style={[s.visPill, vis === "public" && s.visOn]}>
          <Ionicons
            name={vis === "public" ? "globe-outline" : "lock-closed-outline"}
            size={11}
            color={vis === "public" ? C.onAccent : C.textDim}
          />
          <Text style={[s.visText, vis === "public" && s.visTextOn]}>
            {vis === "public" ? "Public" : "Private"}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => pl.songs.length > 0 && play(pl.songs[0], pl.songs)}
        hitSlop={8}
        style={s.play}
      >
        <Ionicons name="play" size={20} color={C.onAccent} />
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.surface, borderRadius: 18, padding: 12,
  },
  art: { width: 84, height: 84, borderRadius: 14, backgroundColor: C.surface2 },
  empty: { alignItems: "center", justifyContent: "center" },
  mid: { flex: 1, gap: 4 },
  name: { color: C.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  sub: { color: C.textDim, fontSize: 13, fontWeight: "600" },
  visPill: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 2,
  },
  visOn: { backgroundColor: C.accent, borderColor: C.accent },
  visText: { color: C.textDim, fontSize: 11, fontWeight: "700" },
  visTextOn: { color: C.onAccent },
  play: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
  },
});
