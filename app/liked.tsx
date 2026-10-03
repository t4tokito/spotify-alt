import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../lib/player";
import { SongRow } from "../components/SongRow";
import { C } from "../lib/theme";

export default function LikedSongs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { liked, play } = usePlayer();
  const likedList = Object.values(liked);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={s.title}>Liked Songs</Text>
      </View>
      <View style={s.sub}>
        <Ionicons name="heart" size={15} color={C.like} />
        <Text style={s.count}>{likedList.length} songs</Text>
        <View style={{ flex: 1 }} />
        {likedList.length > 0 && (
          <Pressable
            onPress={() => play(likedList[0], likedList)}
            style={({ pressed }) => [s.playAll, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="play" size={16} color={C.onAccent} />
            <Text style={s.playAllText}>Play All</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        data={likedList}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <SongRow song={item} queue={likedList} />}
        ListEmptyComponent={<Text style={s.empty}>Nothing liked yet — tap the heart on any song.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  head: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 4 },
  back: { padding: 8 },
  title: { color: C.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  sub: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, marginTop: 2, marginBottom: 8 },
  count: { color: C.textDim, fontWeight: "600" },
  playAll: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.accent, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8,
  },
  playAllText: { color: C.onAccent, fontWeight: "800", fontSize: 13 },
  empty: { color: C.textFaint, paddingHorizontal: 16, marginTop: 20 },
});
