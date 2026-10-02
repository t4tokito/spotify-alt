import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../lib/player";
import { usePlaylists } from "../lib/playlists";
import { SongRow } from "../components/SongRow";
import { CreatePlaylistModal } from "../components/CreatePlaylistModal";
import { PLAYLIST_ICONS } from "../lib/playlistIcons";
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
      <CreatePlaylistModal visible={createOpen} onClose={() => setCreateOpen(false)} />
      {playlists.map((pl) => (
        <Pressable
          key={pl.id}
          onPress={() => router.push(`/playlist/${pl.id}` as any)}
          style={({ pressed }) => [s.plRow, pressed && { opacity: 0.6 }]}
        >
          <View style={s.plArt}>
            {pl.icon && PLAYLIST_ICONS[pl.icon] ? (
              <Image source={PLAYLIST_ICONS[pl.icon]} style={s.plArtImg} />
            ) : (
              <Ionicons name="musical-notes" size={22} color={C.accent} />
            )}
          </View>
          <View style={s.mid}>
            <Text numberOfLines={1} style={s.plName}>{pl.name}</Text>
            <Text style={s.plSub}>{pl.songs.length} songs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.neutral} />
        </Pressable>
      ))}
      {playlists.length === 0 && (
        <Text style={s.empty}>No playlists yet — tap + to make one, or add any song from its list icon.</Text>
      )}

      <SectionTitle title="Liked Songs" icon="heart" color={C.like} size={18} />
      <FlatList
        data={likedList}
        keyExtractor={(i) => i.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <SongRow song={item} queue={likedList} />}
        ListEmptyComponent={<Text style={s.empty}>Nothing liked yet.</Text>}
        ListFooterComponent={
          <View>
            <SectionTitle title="History" icon="time-outline" color={C.neutral} size={18} />
            {history.map((song) => (
              <SongRow key={"h" + song.id} song={song} queue={history} />
            ))}
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#121212" },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.6, paddingHorizontal: 16 },
  count: { color: "#BC8CF2", paddingHorizontal: 16, marginTop: 4, fontWeight: "600" },
  plHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  plTitleWrap: { flex: 1 },
  addBtn: { padding: 4 },
  plRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 12 },
  plArt: { width: 52, height: 52, borderRadius: 12, backgroundColor: "#1e1e1e", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  plArtImg: { width: 52, height: 52, borderRadius: 12 },
  mid: { flex: 1 },
  plName: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  plSub: { color: "#888", fontSize: 13, marginTop: 2 },
  empty: { color: "#777", paddingHorizontal: 16, marginTop: 8, lineHeight: 20 },
});
