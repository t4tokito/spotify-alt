import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Song } from "../lib/music";
import { usePlaylists } from "../lib/playlists";
import { C } from "../lib/theme";

/** Bulk-import someone's public playlist songs into one of your playlists. */
export function ImportPlaylistModal({
  visible,
  songs,
  sourceName,
  onClose,
}: {
  visible: boolean;
  songs: Song[];
  sourceName: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { playlists, createPlaylist, addToPlaylist } = usePlaylists();
  const [name, setName] = useState("");
  const [doneId, setDoneId] = useState<string | null>(null);

  function importInto(id: string) {
    for (const s of songs) addToPlaylist(id, s);
    setDoneId(id);
    setTimeout(onClose, 600);
  }

  function createAndImport() {
    if (!name.trim()) return;
    const pl = createPlaylist(name || `${sourceName} (copy)`);
    for (const s of songs) addToPlaylist(pl.id, s);
    setName("");
    setDoneId(pl.id);
    setTimeout(onClose, 600);
  }

  function close() {
    setName("");
    setDoneId(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={s.back} onPress={close} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.handle} />
        <Text style={s.title}>Save to your library</Text>
        <Text style={s.sub}>{songs.length} songs</Text>
        <View style={s.createRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="New playlist name"
            placeholderTextColor="#777"
            style={s.input}
          />
          <Pressable onPress={createAndImport} style={s.createBtn}>
            <Ionicons name="add" size={22} color={C.onAccent} />
          </Pressable>
        </View>
        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          style={{ maxHeight: 300 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => importInto(item.id)} style={s.row}>
              <View style={s.art}>
                <Ionicons name="musical-notes-outline" size={20} color={C.accent} />
              </View>
              <View style={s.mid}>
                <Text numberOfLines={1} style={s.rowTitle}>{item.name}</Text>
                <Text style={s.rowSub}>{item.songs.length} songs</Text>
              </View>
              {doneId === item.id ? (
                <Ionicons name="checkmark-circle" size={22} color={C.accent} />
              ) : (
                <Ionicons name="download-outline" size={22} color={C.neutral} />
              )}
            </Pressable>
          )}
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
  title: { color: C.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
  sub: { color: C.textDim, fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 12 },
  createRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  input: { flex: 1, backgroundColor: C.surface2, borderRadius: 10, padding: 12, color: C.text, fontSize: 15 },
  createBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  art: { width: 46, height: 46, borderRadius: 10, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" },
  mid: { flex: 1 },
  rowTitle: { color: C.text, fontWeight: "700", fontSize: 15 },
  rowSub: { color: C.textDim, fontSize: 12, marginTop: 2 },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 16 },
});
