import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../lib/player";
import { usePlaylists } from "../lib/playlists";
import { SongRow } from "../components/SongRow";
import { PlaylistRow } from "../components/PlaylistRow";
import { CreatePlaylistModal } from "../components/CreatePlaylistModal";
import { SectionTitle } from "../components/SectionTitle";
import { C } from "../lib/theme";

export default function Library() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { liked, history } = usePlayer();
  const { playlists } = usePlaylists();
  const likedList = Object.values(liked);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Text style={s.title}>Your Library</Text>
      <Text style={s.count}>
        {playlists.length} Playlists • {likedList.length} Liked • {history.length} Played
      </Text>

      <FlatList
        data={history}
        keyExtractor={(i) => "h-" + i.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={s.plHeader}>
              <View style={s.plTitleWrap}>
                <SectionTitle title={`Playlists (${playlists.length})`} icon="list" color={C.accent} size={18} tight />
              </View>
              <Pressable
                onPress={() => setCreateOpen(true)}
                hitSlop={8}
                style={({ pressed }) => [s.addBtn, pressed && { opacity: 0.55 }]}
              >
                <Ionicons name="add" size={22} color={C.accent} />
              </Pressable>
            </View>
            {playlists.slice(0, 3).map((pl) => (
              <PlaylistRow key={pl.id} pl={pl} />
            ))}
            {playlists.length === 0 && (
              <Text style={s.empty}>No playlists yet — tap + to make one.</Text>
            )}
            {playlists.length > 3 && (
              <Pressable
                onPress={() => router.push("/playlists" as any)}
                style={({ pressed }) => [s.more, pressed && { opacity: 0.6 }]}
              >
                <Text style={s.moreText}>Show all {playlists.length} playlists</Text>
                <Ionicons name="chevron-forward" size={18} color={C.accent} />
              </Pressable>
            )}

            <Pressable
              onPress={() => router.push("/liked" as any)}
              style={({ pressed }) => [s.likedRow, pressed && { opacity: 0.6 }]}
            >
              <View style={s.likedArt}>
                <Ionicons name="heart" size={22} color={C.like} />
              </View>
              <View style={s.mid}>
                <Text style={s.likedName}>Liked Songs</Text>
                <Text style={s.likedSub}>{likedList.length} songs</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.neutral} />
            </Pressable>

            <SectionTitle title="History" icon="time-outline" color={C.neutral} size={18} />
          </View>
        }
        renderItem={({ item }) => <SongRow song={item} queue={history} />}
        ListEmptyComponent={<Text style={s.empty}>Nothing played yet.</Text>}
      />
      <CreatePlaylistModal visible={createOpen} onClose={() => setCreateOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  title: { color: C.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.6, paddingHorizontal: 16 },
  count: { color: C.accent, paddingHorizontal: 16, marginTop: 4, fontWeight: "600" },
  plHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  plTitleWrap: { flex: 1 },
  addBtn: { padding: 4 },
  more: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 12 },
  moreText: { color: C.accent, fontWeight: "700", fontSize: 14 },
  likedRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 12, marginTop: 6 },
  likedArt: { width: 52, height: 52, borderRadius: 12, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  mid: { flex: 1 },
  likedName: { color: C.text, fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  likedSub: { color: C.textDim, fontSize: 13, marginTop: 2 },
  empty: { color: C.textFaint, paddingHorizontal: 16, marginTop: 8, lineHeight: 20 },
});
