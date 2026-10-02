import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../lib/player";
import { usePlaylists } from "../lib/playlists";
import { SongRow } from "../components/SongRow";

export default function Library() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { liked, history } = usePlayer();
  const { playlists, createPlaylist } = usePlaylists();
  const likedList = Object.values(liked);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  function create() {
    if (!name.trim()) return;
    createPlaylist(name);
    setName("");
    setCreating(false);
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Text style={s.title}>Your Library</Text>
      <Text style={s.count}>
        {playlists.length} Playlists • {likedList.length} Liked • {history.length} Played
      </Text>

      <View style={s.secHeader}>
        <Ionicons name="list" size={18} color="#BC8CF2" />
        <Text style={s.secTitle}>Playlists</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setCreating((v) => !v)} hitSlop={8} style={s.addBtn}>
          <Ionicons name={creating ? "close" : "add"} size={20} color="#BC8CF2" />
        </Pressable>
      </View>
      {creating && (
        <View style={s.createRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Playlist name"
            placeholderTextColor="#777"
            style={s.input}
            autoFocus
          />
          <Pressable onPress={create} style={s.createBtn}>
            <Text style={s.createText}>Create</Text>
          </Pressable>
        </View>
      )}
      {playlists.map((pl) => (
        <Pressable key={pl.id} onPress={() => router.push(`/playlist/${pl.id}` as any)} style={s.plRow}>
          <View style={s.plArt}>
            <Ionicons name="musical-notes" size={22} color="#BC8CF2" />
          </View>
          <View style={s.mid}>
            <Text numberOfLines={1} style={s.plName}>{pl.name}</Text>
            <Text style={s.plSub}>{pl.songs.length} songs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </Pressable>
      ))}
      {playlists.length === 0 && !creating && (
        <Text style={s.empty}>No playlists yet — tap + to make one, or add any song from its list icon.</Text>
      )}

      <View style={s.secHeader}>
        <Ionicons name="heart" size={18} color="#BC8CF2" />
        <Text style={s.secTitle}>Liked Songs</Text>
      </View>
      <FlatList
        data={likedList}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <SongRow song={item} queue={likedList} />}
        ListEmptyComponent={<Text style={s.empty}>Nothing liked yet.</Text>}
        ListFooterComponent={
          <View>
            <View style={s.secHeader}>
              <Ionicons name="time-outline" size={18} color="#BC8CF2" />
              <Text style={s.secTitle}>History</Text>
            </View>
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
  title: { color: "#fff", fontSize: 28, fontWeight: "900", paddingHorizontal: 16 },
  count: { color: "#BC8CF2", paddingHorizontal: 16, marginTop: 4, fontWeight: "600" },
  secHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginTop: 18, marginBottom: 6 },
  secTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  addBtn: { padding: 4 },
  createRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  input: { flex: 1, backgroundColor: "#1e1e1e", borderRadius: 10, padding: 12, color: "#fff", fontSize: 15 },
  createBtn: { backgroundColor: "#BC8CF2", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  createText: { color: "#141414", fontWeight: "800" },
  plRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 12 },
  plArt: { width: 52, height: 52, borderRadius: 6, backgroundColor: "#1e1e1e", alignItems: "center", justifyContent: "center" },
  mid: { flex: 1 },
  plName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  plSub: { color: "#888", fontSize: 13, marginTop: 2 },
  empty: { color: "#777", paddingHorizontal: 16, marginTop: 8, lineHeight: 20 },
});
