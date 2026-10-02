import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Song, searchSongs } from "../lib/music";
import { SongRow } from "../components/SongRow";

const QUICK = ["Arijit Singh", "Diljit Dosanjh", "AP Dhillon", "Shreya Ghoshal", "Honey Singh", "Lata Mangeshkar", "KR$NA", "Taylor Swift"];

export default function Search() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);

  async function doSearch(query: string) {
    setQ(query);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      setResults(await searchSongs(query, 25));
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Text style={s.title}>Search</Text>
      <TextInput
        value={q}
        onChangeText={doSearch}
        placeholder="Songs, artists… (free, no ads)"
        placeholderTextColor="#777"
        style={s.input}
        autoCorrect={false}
      />
      {!q && (
        <View style={s.chips}>
          {QUICK.map((c) => (
            <Text key={c} onPress={() => doSearch(c)} style={s.chip}>{c}</Text>
          ))}
        </View>
      )}
      {loading && <ActivityIndicator color="#BC8CF2" style={{ marginTop: 20 }} />}
      <FlatList
        data={results}
        keyExtractor={(i) => i.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => <SongRow song={item} queue={results} index={index} />}
        ListEmptyComponent={!loading && q ? (
          <View style={s.emptyRow}>
            <Ionicons name="musical-note-outline" size={18} color="#777" />
            <Text style={s.emptyText}>No results. Try another song</Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#121212" },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", paddingHorizontal: 16, marginBottom: 10 },
  input: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 8, padding: 12, fontSize: 16, color: "#000" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 16 },
  chip: { backgroundColor: "#222", color: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, overflow: "hidden" },
  emptyRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 30 },
  emptyText: { color: "#777" },
});
