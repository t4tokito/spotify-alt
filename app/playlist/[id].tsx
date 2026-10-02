import { useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../../lib/player";
import { usePlaylists } from "../../lib/playlists";
import { SongRow } from "../../components/SongRow";
import { AddSongsModal } from "../../components/AddSongsModal";
import { C, tint } from "../../lib/theme";

function totalMins(songs: { duration: number }[]): string {
  const secs = songs.reduce((a, s) => a + (s.duration || 0), 0);
  const m = Math.round(secs / 60);
  return m < 1 ? "few sec" : `${m} min`;
}

function Cover({ songs }: { songs: { image: string; imageSmall: string }[] }) {
  const arts = songs.slice(0, 4);
  if (arts.length === 0) {
    return (
      <View style={[s.cover, s.coverEmpty]}>
        <Ionicons name="musical-notes" size={56} color={C.accent} />
      </View>
    );
  }
  if (arts.length < 4) {
    return <Image source={{ uri: arts[0].image }} style={s.cover} />;
  }
  return (
    <View style={s.cover}>
      {arts.map((a, i) => (
        <Image key={i} source={{ uri: a.imageSmall || a.image }} style={s.cell} />
      ))}
    </View>
  );
}

export default function PlaylistDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { play } = usePlayer();
  const { playlists, deletePlaylist, removeFromPlaylist } = usePlaylists();
  const [addOpen, setAddOpen] = useState(false);
  const pl = playlists.find((p) => p.id === id);

  if (!pl) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={s.muted}>Playlist not found.</Text>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[tint(C.accent, 0.28), "transparent"]} style={s.fade}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
      </LinearGradient>

      <FlatList
        data={pl.songs}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={
          <View style={s.header}>
            <Cover songs={pl.songs} />
            <Text style={s.title}>{pl.name}</Text>
            <Text style={s.meta}>
              {pl.songs.length} songs • {totalMins(pl.songs)}
            </Text>
            <View style={s.controls}>
              <Pressable
                onPress={() => pl.songs.length > 0 && play(pl.songs[0], pl.songs)}
                disabled={pl.songs.length === 0}
                style={({ pressed }) => [
                  s.playBtn,
                  pl.songs.length === 0 && s.disabled,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] },
                ]}
              >
                <Ionicons name="play" size={30} color={C.onAccent} />
              </Pressable>
              <Pressable
                onPress={() => setAddOpen(true)}
                hitSlop={10}
                style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.55 }]}
              >
                <Ionicons name="add-circle-outline" size={28} color={C.textDim} />
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => {
                  deletePlaylist(pl.id);
                  router.back();
                }}
                hitSlop={10}
                style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.55 }]}
              >
                <Ionicons name="trash-outline" size={24} color={C.neutral} />
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <SongRow song={item} queue={pl.songs} onRemove={() => removeFromPlaylist(pl.id, item.id)} />
        )}
        ListEmptyComponent={<Text style={s.empty}>Empty — tap + above to add songs.</Text>}
      />
      <AddSongsModal visible={addOpen} playlistId={pl.id} playlistName={pl.name} onClose={() => setAddOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  fade: { paddingHorizontal: 8, paddingBottom: 4 },
  back: { paddingHorizontal: 8, paddingVertical: 6, alignSelf: "flex-start" },
  header: { alignItems: "center", paddingHorizontal: 24, paddingTop: 6, paddingBottom: 8 },
  cover: {
    width: 200, height: 200, borderRadius: 14, backgroundColor: C.surface,
    flexDirection: "row", flexWrap: "wrap", overflow: "hidden",
  },
  coverEmpty: { alignItems: "center", justifyContent: "center" },
  cell: { width: "50%", height: "50%", backgroundColor: C.surface2 },
  title: {
    color: C.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.7,
    textAlign: "center", marginTop: 16,
  },
  meta: { color: C.textDim, fontSize: 13, fontWeight: "600", marginTop: 6 },
  controls: { flexDirection: "row", alignItems: "center", width: "100%", marginTop: 16, gap: 4 },
  playBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
  },
  disabled: { opacity: 0.35 },
  iconBtn: { padding: 10 },
  muted: { color: C.textDim },
  backBtn: { backgroundColor: C.accent, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  backText: { color: C.onAccent, fontWeight: "800" },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 24 },
});
