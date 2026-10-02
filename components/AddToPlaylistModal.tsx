import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Song } from "../lib/music";
import { usePlaylists } from "../lib/playlists";

export function AddToPlaylistModal({
  visible,
  song,
  onClose,
}: {
  visible: boolean;
  song: Song;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { playlists, createPlaylist, addToPlaylist, isInPlaylist } = usePlaylists();
  const [name, setName] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);

  function create() {
    if (!name.trim()) return;
    const pl = createPlaylist(name);
    addToPlaylist(pl.id, song);
    setName("");
    setAddedId(pl.id);
    setTimeout(onClose, 500);
  }

  function add(id: string) {
    addToPlaylist(id, song);
    setAddedId(id);
    setTimeout(onClose, 500);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.back} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.handle} />
        <Text style={s.title}>Add to playlist</Text>
        <Text numberOfLines={1} style={s.song}>{song.name} • {song.artists}</Text>
        <View style={s.createRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="New playlist name"
            placeholderTextColor="#777"
            style={s.input}
          />
          <Pressable onPress={create} style={s.createBtn}>
            <Ionicons name="add" size={22} color="#141414" />
          </Pressable>
        </View>
        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          style={{ maxHeight: 300 }}
          renderItem={({ item }) => {
            const added = isInPlaylist(item.id, song.id) || addedId === item.id;
            return (
              <Pressable onPress={() => add(item.id)} style={s.row}>
                <View style={s.art}>
                  <Ionicons name="musical-notes-outline" size={20} color="#BC8CF2" />
                </View>
                <View style={s.mid}>
                  <Text numberOfLines={1} style={s.rowTitle}>{item.name}</Text>
                  <Text style={s.rowSub}>{item.songs.length} songs</Text>
                </View>
                {added ? (
                  <Ionicons name="checkmark-circle" size={22} color="#BC8CF2" />
                ) : (
                  <Ionicons name="add-circle-outline" size={22} color="#888" />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={<Text style={s.empty}>No playlists yet — create one above.</Text>}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center", marginBottom: 12 },
  title: { color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "center" },
  song: { color: "#888", fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 12 },
  createRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  input: { flex: 1, backgroundColor: "#222", borderRadius: 10, padding: 12, color: "#fff", fontSize: 15 },
  createBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#BC8CF2", alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  art: { width: 46, height: 46, borderRadius: 8, backgroundColor: "#222", alignItems: "center", justifyContent: "center" },
  mid: { flex: 1 },
  rowTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  rowSub: { color: "#888", fontSize: 12, marginTop: 2 },
  empty: { color: "#777", textAlign: "center", marginTop: 16 },
});
