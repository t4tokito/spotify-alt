import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../lib/player";
import { SectionTitle } from "../components/SectionTitle";
import { C, tint } from "../lib/theme";

export default function Stats() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { stats, play } = usePlayer();
  const list = Object.values(stats).sort((a, b) => b.n - a.n);

  const minutes = Math.round(list.reduce((acc, s) => acc + s.n * (s.song.duration || 0), 0) / 60);

  const artists = new Map<string, number>();
  for (const s of list) {
    for (const a of s.song.artists.split(",").map((x) => x.trim()).filter(Boolean)) {
      artists.set(a, (artists.get(a) ?? 0) + s.n);
    }
  }
  const topArtists = [...artists.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topSongs = list.slice(0, 15);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
        <Ionicons name="arrow-back" size={24} color={C.text} />
      </Pressable>
      <FlatList
        data={topSongs}
        keyExtractor={(i) => i.song.id}
        ListHeaderComponent={
          <View>
            <LinearGradient colors={[tint(C.accent, 0.35), "transparent"]} style={s.hero}>
              <Text style={s.kicker}>YOUR VIBE CHECK</Text>
              <Text style={s.minutes}>{minutes}</Text>
              <Text style={s.minutesSub}>minutes played</Text>
              <View style={s.chips}>
                <View style={s.chip}>
                  <Text style={s.chipNum}>{list.length}</Text>
                  <Text style={s.chipLabel}>songs</Text>
                </View>
                <View style={s.chip}>
                  <Text style={s.chipNum}>{artists.size}</Text>
                  <Text style={s.chipLabel}>artists</Text>
                </View>
              </View>
            </LinearGradient>
            <SectionTitle title="Top artists" icon="mic-outline" color={C.trending} size={18} />
            {topArtists.map(([name, n], i) => (
              <View key={name} style={s.artistRow}>
                <Text style={s.rank}>{i + 1}</Text>
                <Text numberOfLines={1} style={s.artistName}>{name}</Text>
                <Text style={s.plays}>{n} plays</Text>
              </View>
            ))}
            <SectionTitle title="Top songs" icon="trophy-outline" color={C.like} size={18} />
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable onPress={() => play(item.song, [item.song])} style={s.row}>
            <Text style={s.rank}>{index + 1}</Text>
            <Image source={{ uri: item.song.imageSmall || item.song.image }} style={s.art} />
            <View style={s.mid}>
              <Text numberOfLines={1} style={s.name}>{item.song.name}</Text>
              <Text numberOfLines={1} style={s.sub}>{item.song.artists}</Text>
            </View>
            <Text style={s.plays}>{item.n} plays</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={s.empty}>Play some music first — your stats will appear here.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  back: { paddingHorizontal: 16, paddingVertical: 4, alignSelf: "flex-start" },
  hero: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 24 },
  kicker: { color: C.accent, fontWeight: "800", fontSize: 12, letterSpacing: 2 },
  minutes: { color: C.text, fontSize: 64, fontWeight: "900", letterSpacing: -2, marginTop: 4 },
  minutesSub: { color: C.textDim, fontSize: 14, fontWeight: "600" },
  chips: { flexDirection: "row", gap: 12, marginTop: 16 },
  chip: {
    backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12, alignItems: "center",
  },
  chipNum: { color: C.text, fontSize: 20, fontWeight: "800" },
  chipLabel: { color: C.textDim, fontSize: 12 },
  artistRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 16, gap: 12 },
  rank: { color: C.neutral, fontSize: 15, fontWeight: "800", width: 24 },
  artistName: { flex: 1, color: C.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 16, gap: 10 },
  art: { width: 48, height: 48, borderRadius: 10, backgroundColor: C.surface },
  mid: { flex: 1 },
  name: { color: C.text, fontSize: 15, fontWeight: "600" },
  sub: { color: C.textDim, fontSize: 12, marginTop: 2 },
  plays: { color: C.textDim, fontSize: 12, fontWeight: "700" },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 30, paddingHorizontal: 24 },
});
