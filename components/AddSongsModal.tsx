import { useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Song, searchSongs } from "../lib/music";
import { usePlaylists } from "../lib/playlists";

export function AddSongsModal({
  visible,
  playlistId,
  playlistName,
  onClose,
}: {
  visible: boolean;
  playlistId: string;
  playlistName: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { addToPlaylist, isInPlaylist } = usePlaylists();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setTick] = useState(0);

  async function doSearch(query: string) {
    setQ(query);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      setResults(await searchSongs(query, 20));
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  function add(song: Song) {
    addToPlaylist(playlistId, song);
    setTick((t) => t + 1);
  }

  function close() {
    setQ("");
    setResults([]);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={s.back} onPress={close} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.handle} />
        <Text style={s.title}>Add to {playlistName}</Text>
        <TextInput
          value={q}
          onChangeText={doSearch}
          placeholder="Search songs to add…"
          placeholderTextColor="#777"
          style={s.input}
          autoCorrect={false}
        />
        {loading && <ActivityIndicator color="#BC8CF2" style={{ marginTop: 16 }} />}
        <FlatList
          data={results}
          keyExtractor={(i) => i.id}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 380 }}
          renderItem={({ item }) => {
            const added = isInPlaylist(playlistId, item.id);
            return (
              <View style={s.row}>
                <Image source={{ uri: item.imageSmall || item.image }} style={s.art} />
                <View style={s.mid}>
                  <Text numberOfLines={1} style={s.rowTitle}>{item.name}</Text>
                  <Text numberOfLines={1} style={s.rowSub}>{item.artists}</Text>
                </View>
                <Pressable onPress={() => add(item)} hitSlop={10} style={s.addBtn}>
                  {added ? (
                    <Ionicons name="checkmark-circle" size={24} color="#BC8CF2" />
                  ) : (
                    <Ionicons name="add-circle-outline" size={24} color="#888" />
                  )}
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            !loading && q ? <Text style={s.empty}>No results. Try another song</Text> : null
          }
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, gap: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center", marginBottom: 4 },
  title: { color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "center" },
  input: { backgroundColor: "#222", borderRadius: 10, padding: 13, color: "#fff", fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12 },
  art: { width: 48, height: 48, borderRadius: 6, backgroundColor: "#222" },
  mid: { flex: 1 },
  rowTitle: { color: "#fff", fontWeight: "600", fontSize: 15 },
  rowSub: { color: "#888", fontSize: 12, marginTop: 2 },
  addBtn: { padding: 6 },
  empty: { color: "#777", textAlign: "center", marginTop: 16 },
});
