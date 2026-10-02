import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "../lib/player";
import { SongRow } from "../components/SongRow";

export default function Library() {
  const insets = useSafeAreaInsets();
  const { liked, history } = usePlayer();
  const likedList = Object.values(liked);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Text style={s.title}>Your Library</Text>
      <Text style={s.count}>{likedList.length} Liked • {history.length} Played</Text>
      <View style={s.secHeader}>
        <Ionicons name="heart" size={18} color="#790D16" />
        <Text style={s.secTitle}>Liked Songs</Text>
      </View>
      <FlatList
        data={likedList}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <SongRow song={item} queue={likedList} />}
        ListEmptyComponent={<Text style={s.empty}>Abhi kuch like nahi kiya.</Text>}
        ListFooterComponent={
          <View>
            <View style={s.secHeader}>
              <Ionicons name="time-outline" size={18} color="#790D16" />
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
  count: { color: "#790D16", paddingHorizontal: 16, marginTop: 4, fontWeight: "600" },
  secHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginTop: 18, marginBottom: 6 },
  secTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  empty: { color: "#777", paddingHorizontal: 16, marginTop: 8 },
});
