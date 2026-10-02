import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HOME_SECTIONS, Song, getInstagramTrending, searchSongs } from "../lib/music";
import { usePlayer } from "../lib/player";
import { SongRow } from "../components/SongRow";
import { SectionTitle } from "../components/SectionTitle";
import { C } from "../lib/theme";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { play, history } = usePlayer();
  const [sections, setSections] = useState<{ title: string; songs: Song[]; icon?: string; color?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [insta, ...rest] = await Promise.all([
        getInstagramTrending(12),
        ...HOME_SECTIONS.map(async (sec) => ({
          title: sec.title,
          songs: (await searchSongs(sec.query, 10)).slice(0, 10),
        })),
      ]);
      const all = [
        { title: "Instagram Trending", icon: "flame", color: C.trending, songs: insta.slice(0, 12) },
        ...rest,
      ];
      setSections(all.filter((r) => r.songs.length > 0));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#BC8CF2" size="large" />
        <Text style={s.loadText}>Loading Tokito Music… 100% Free, No Ads</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#BC8CF2" />}
    >
      <LinearGradient colors={["#BC8CF233", "#121212"]} style={s.hero}>
        <View style={s.greetRow}>
          <Text style={s.greet}>Good evening</Text>
          <Ionicons name="headset-outline" size={16} color="#ccc" />
        </View>
        <Text style={s.brand}>Tokito Music</Text>
        <Text style={s.tag}>100% Free • No Ads • 320kbps</Text>
      </LinearGradient>

      {history.length > 0 && (
        <>
          <SectionTitle title="Recently Played" icon="time-outline" color={C.neutral} />
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
          {sec.icon ? (
            <SectionTitle title={sec.title} icon={sec.icon} color={sec.color ?? C.accent} />
          ) : (
            <Text style={s.secTitle}>{sec.title}</Text>
          )}
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
  greetRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brand: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4, letterSpacing: -0.8 },
  tag: { color: "#BC8CF2", fontWeight: "700", marginTop: 6 },
  secTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.4, paddingHorizontal: 16, marginTop: 22, marginBottom: 12 },
  card: { width: 140 },
  cardArt: { width: 140, height: 140, borderRadius: 14, backgroundColor: "#222" },
  cardTitle: { color: "#fff", fontWeight: "700", marginTop: 6, fontSize: 13, letterSpacing: -0.2 },
  cardSub: { color: "#888", fontSize: 12 },
});
