import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Song, searchSongs } from "../lib/saavn";
import { searchYouTube } from "../lib/youtube";
import { SongRow } from "../components/SongRow";

const QUICK = ["Arijit Singh", "Diljit Dosanjh", "AP Dhillon", "Shreya Ghoshal", "Honey Singh", "Lata Mangeshkar", "KR$NA", "Taylor Swift"];

type Source = "saavn" | "youtube";

export default function Search() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<Source>("saavn");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function doSearch(query: string, source: Source = src) {
    setQ(query);
    setError("");
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      setResults(
        source === "saavn" ? await searchSongs(query, 25) : await searchYouTube(query, 15)
      );
    } catch {
      setResults([]);
      if (source === "youtube") {
        setError("YT server se connect nahi hua 📡 Laptop pe server chal raha? (cd server && npm start) + EXPO_PUBLIC_YT_URL check karo.");
      }
    }
    setLoading(false);
  }

  function switchSource(s: Source) {
    setSrc(s);
    if (q.trim()) doSearch(q, s);
    else { setResults([]); setError(""); }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Text style={s.title}>Search</Text>
      <View style={s.tabs}>
        {(["saavn", "youtube"] as Source[]).map((t) => (
          <Pressable key={t} onPress={() => switchSource(t)} style={[s.tab, src === t && s.tabActive]}>
            <Text style={[s.tabText, src === t && s.tabTextActive]}>
              {t === "saavn" ? "🎵 JioSaavn" : "▶️ YouTube"}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={q}
        onChangeText={(t) => doSearch(t)}
        placeholder={src === "saavn" ? "Songs, artists… (free, no ads)" : "YouTube pe kuch bhi… (thumbnail ke sath)"}
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
      {loading && <ActivityIndicator color="#1DB954" style={{ marginTop: 20 }} />}
      {!!error && <Text style={s.error}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(i) => i.id}
        renderItem={({ item, index }) => <SongRow song={item} queue={results} index={index} />}
        ListEmptyComponent={!loading && !error && q ? <Text style={s.empty}>No results. Try another song 🎵</Text> : null}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#121212" },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", paddingHorizontal: 16, marginBottom: 10 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  tab: { flex: 1, backgroundColor: "#222", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#1DB954" },
  tabText: { color: "#888", fontWeight: "800" },
  tabTextActive: { color: "#000" },
  input: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 8, padding: 12, fontSize: 16, color: "#000" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 16 },
  chip: { backgroundColor: "#222", color: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, overflow: "hidden" },
  empty: { color: "#777", textAlign: "center", marginTop: 30 },
  error: { color: "#ff8080", paddingHorizontal: 16, marginTop: 16, lineHeight: 20 },
});
