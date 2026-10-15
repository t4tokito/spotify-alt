import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../lib/player";
import { useDownloads } from "../lib/downloads";
import { C } from "../lib/theme";

export default function Downloads() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { play, current, isPlaying } = usePlayer();
  const { downloaded, remove, totalBytes } = useDownloads();
  const list = Object.values(downloaded);
  const mb = (totalBytes / 1048576).toFixed(1);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={s.title}>Downloads</Text>
      </View>
      <View style={s.sub}>
        <Ionicons name="download-outline" size={15} color={C.accent} />
        <Text style={s.count}>{list.length} songs • {mb} MB • plays offline</Text>
        <View style={{ flex: 1 }} />
        {list.length > 0 && (
          <Pressable
            onPress={() => play(list[0].song, list.map((d) => d.song))}
            style={({ pressed }) => [s.playAll, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="play" size={16} color={C.onAccent} />
            <Text style={s.playAllText}>Play All</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        data={list}
        keyExtractor={(d) => d.song.id}
        renderItem={({ item }) => {
          const active = current?.id === item.song.id;
          return (
            <Pressable
              onPress={() => play(item.song, list.map((d) => d.song))}
              style={[s.row, active && s.active]}
            >
              <Image source={{ uri: item.song.imageSmall || item.song.image }} style={s.art} />
              <View style={s.mid}>
                <Text numberOfLines={1} style={[s.name, active && s.nameOn]}>{item.song.name}</Text>
                <Text numberOfLines={1} style={s.sub2}>
                  {item.song.artists}
                  {item.size ? ` • ${(item.size / 1048576).toFixed(1)} MB` : ""}
                </Text>
              </View>
              {active && isPlaying && <Ionicons name="stats-chart" size={18} color={C.accent} />}
              <Pressable onPress={() => remove(item.song.id)} hitSlop={10} style={s.rm}>
                <Ionicons name="trash-outline" size={20} color={C.neutral} />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.empty}>Nothing downloaded yet.</Text>
            <Text style={s.emptySub}>Open any song and tap “Download for offline”.</Text>
          </View>
        }
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
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 10 },
  active: { backgroundColor: "rgba(188,140,242,0.08)" },
  art: { width: 52, height: 52, borderRadius: 11, backgroundColor: C.surface },
  mid: { flex: 1 },
  name: { color: C.text, fontSize: 15, fontWeight: "600" },
  nameOn: { color: C.accent },
  sub2: { color: C.textDim, fontSize: 12, marginTop: 2 },
  rm: { padding: 6 },
  emptyWrap: { alignItems: "center", marginTop: 40, gap: 6, paddingHorizontal: 32 },
  empty: { color: C.text, fontWeight: "800", fontSize: 16 },
  emptySub: { color: C.textFaint, textAlign: "center", lineHeight: 20 },
});
