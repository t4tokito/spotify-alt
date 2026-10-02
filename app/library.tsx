import { FlatList, StyleSheet, Text, View } from "react-native";
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
      <Text style={s.sec}>❤️ Liked Songs</Text>
      <FlatList
        data={likedList}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <SongRow song={item} queue={likedList} />}
        ListEmptyComponent={<Text style={s.empty}>Abhi kuch like nahi kiya. ♥ dabao!</Text>}
        ListFooterComponent={
          <View>
            <Text style={s.sec}>🕘 History</Text>
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
  count: { color: "#1DB954", paddingHorizontal: 16, marginTop: 4, fontWeight: "600" },
  sec: { color: "#fff", fontSize: 18, fontWeight: "800", paddingHorizontal: 16, marginTop: 18, marginBottom: 6 },
  empty: { color: "#777", paddingHorizontal: 16, marginTop: 8 },
});
