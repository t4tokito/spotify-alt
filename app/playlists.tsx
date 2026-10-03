import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlaylists } from "../lib/playlists";
import { PlaylistRow } from "../components/PlaylistRow";
import { CreatePlaylistModal } from "../components/CreatePlaylistModal";
import { C } from "../lib/theme";

export default function AllPlaylists() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { playlists } = usePlaylists();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={s.title}>Playlists</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setCreateOpen(true)} hitSlop={8} style={s.add}>
          <Ionicons name="add" size={24} color={C.accent} />
        </Pressable>
      </View>
      <Text style={s.count}>{playlists.length} playlists</Text>
      <FlatList
        data={playlists}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PlaylistRow pl={item} />}
        ListEmptyComponent={<Text style={s.empty}>No playlists yet — tap + to make one.</Text>}
      />
      <CreatePlaylistModal visible={createOpen} onClose={() => setCreateOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  head: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 4 },
  back: { padding: 8 },
  title: { color: C.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  add: { padding: 8 },
  count: { color: C.accent, paddingHorizontal: 16, marginTop: 2, fontWeight: "600", marginBottom: 8 },
  empty: { color: C.textFaint, paddingHorizontal: 16, marginTop: 20 },
});
