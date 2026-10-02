import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HOME_SECTIONS, Song, searchSongs } from "../lib/music";
import { usePlayer } from "../lib/player";
import { SongRow } from "../components/SongRow";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { play, history } = usePlayer();
  const [sections, setSections] = useState<{ title: string; songs: Song[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const results = await Promise.all(
        HOME_SECTIONS.slice(0, 4).map(async (sec) => ({
          title: sec.title,
          songs: (await searchSongs(sec.query, 10)).slice(0, 10),
        }))
      );
      setSections(results.filter((r) => r.songs.length > 0));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#1DB954" size="large" />
        <Text style={s.loadText}>Loading Tokito Music… 100% Free, No Ads</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1DB954" />}
    >
      <LinearGradient colors={["#1DB95433", "#121212"]} style={s.hero}>
        <Text style={s.greet}>Good evening 🎧</Text>
        <Text style={s.brand}>Tokito Music</Text>
        <Text style={s.tag}>100% Free • No Ads • 320kbps</Text>
      </LinearGradient>

      {history.length > 0 && (
        <>
          <Text style={s.secTitle}>Recently Played</Text>
          <FlatList
            horizontal
            data={history.slice(0, 10)}
            keyExtractor={(i) => "h-" + i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => play(item, history)} style={s.card}>
                <Image source={{ uri: item.image }} style={s.cardArt} />
                <Text numberOfLines={1} style={s.cardTitle}>{item.name}</Text>
                <Text numberOfLines={1} style={s.cardSub}>{item.artists}</Text>
              </Pressable>
            )}
          />
        </>
      )}

      {sections.map((sec) => (
        <View key={sec.title}>
          <Text style={s.secTitle}>{sec.title}</Text>
          <FlatList
            horizontal
            data={sec.songs}
            keyExtractor={(i) => sec.title + i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => play(item, sec.songs)} style={s.card}>
                <Image source={{ uri: item.image }} style={s.cardArt} />
                <Text numberOfLines={1} style={s.cardTitle}>{item.name}</Text>
                <Text numberOfLines={1} style={s.cardSub}>{item.artists}</Text>
              </Pressable>
            )}
          />
          {/* top 3 as rows too */}
          {sec.songs.slice(0, 3).map((song, i) => (
            <SongRow key={song.id + i} song={song} queue={sec.songs} />
          ))}
        </View>
      ))}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#121212" },
  center: { flex: 1, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", gap: 12 },
  loadText: { color: "#888" },
  hero: { padding: 20, paddingTop: 26 },
  greet: { color: "#ccc", fontSize: 14 },
  brand: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 },
  tag: { color: "#1DB954", fontWeight: "700", marginTop: 6 },
  secTitle: { color: "#fff", fontSize: 20, fontWeight: "800", paddingHorizontal: 16, marginTop: 22, marginBottom: 12 },
  card: { width: 140 },
  cardArt: { width: 140, height: 140, borderRadius: 8, backgroundColor: "#222" },
  cardTitle: { color: "#fff", fontWeight: "700", marginTop: 6, fontSize: 13 },
  cardSub: { color: "#888", fontSize: 12 },
});
