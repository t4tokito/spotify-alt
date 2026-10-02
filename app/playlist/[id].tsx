import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../../lib/player";
import { usePlaylists } from "../../lib/playlists";
import { SongRow } from "../../components/SongRow";

export default function PlaylistDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { play } = usePlayer();
  const { playlists, deletePlaylist, removeFromPlaylist } = usePlaylists();
  const pl = playlists.find((p) => p.id === id);

  if (!pl) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={s.muted}>Playlist nahi mili.</Text>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={s.back}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </Pressable>
      <Text style={s.title}>{pl.name}</Text>
      <Text style={s.count}>{pl.songs.length} songs</Text>
      <View style={s.actions}>
        <Pressable
          onPress={() => pl.songs.length > 0 && play(pl.songs[0], pl.songs)}
          style={[s.playAll, pl.songs.length === 0 && s.disabled]}
        >
          <Ionicons name="play" size={20} color="#141414" />
          <Text style={s.playAllText}>Play All</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            deletePlaylist(pl.id);
            router.back();
          }}
          style={s.delete}
        >
          <Ionicons name="trash-outline" size={20} color="#ff8080" />
          <Text style={s.deleteText}>Delete</Text>
        </Pressable>
      </View>
      <FlatList
        data={pl.songs}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <SongRow song={item} queue={pl.songs} onRemove={() => removeFromPlaylist(pl.id, item.id)} />
        )}
        ListEmptyComponent={<Text style={s.empty}>Empty — add songs from Search.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#121212" },
  center: { flex: 1, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", gap: 12 },
  back: { paddingHorizontal: 16, paddingVertical: 4, alignSelf: "flex-start" },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", paddingHorizontal: 16, marginTop: 4 },
  count: { color: "#BC8CF2", paddingHorizontal: 16, marginTop: 4, fontWeight: "600" },
  muted: { color: "#888" },
  backBtn: { backgroundColor: "#BC8CF2", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  backText: { color: "#141414", fontWeight: "800" },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 14, marginBottom: 8 },
  playAll: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#BC8CF2", borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
  },
  disabled: { opacity: 0.4 },
  playAllText: { color: "#141414", fontWeight: "800" },
  delete: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "#ff808055", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10,
  },
  deleteText: { color: "#ff8080", fontWeight: "700" },
  empty: { color: "#777", paddingHorizontal: 16, marginTop: 20 },
});
