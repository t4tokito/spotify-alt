import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "../lib/player";
import { C } from "../lib/theme";

export function QueueModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { order, current, isPlaying, jumpTo, removeFromQueue, shuffle, toggleShuffle } = usePlayer();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.back} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.handle} />
        <View style={s.head}>
          <Text style={s.title}>Up next</Text>
          <Pressable onPress={toggleShuffle} hitSlop={8} style={s.shuf}>
            <Ionicons name="shuffle" size={18} color={shuffle ? C.accent : C.neutral} />
            <Text style={[s.shufText, shuffle && s.shufOn]}>Shuffle {shuffle ? "on" : "off"}</Text>
          </Pressable>
        </View>
        <FlatList
          data={order}
          keyExtractor={(i) => i.id}
          style={{ maxHeight: 420 }}
          renderItem={({ item }) => {
            const active = current?.id === item.id;
            return (
              <Pressable onPress={() => jumpTo(item)} style={[s.row, active && s.active]}>
                <Image source={{ uri: item.imageSmall || item.image }} style={s.art} />
                <View style={s.mid}>
                  <Text numberOfLines={1} style={[s.name, active && s.nameOn]}>{item.name}</Text>
                  <Text numberOfLines={1} style={s.sub}>{item.artists}</Text>
                </View>
                {active && isPlaying && <Ionicons name="stats-chart" size={18} color={C.accent} />}
                {!active && (
                  <Pressable onPress={() => removeFromQueue(item.id)} hitSlop={10} style={s.rm}>
                    <Ionicons name="remove-circle-outline" size={20} color={C.neutral} />
                  </Pressable>
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={<Text style={s.empty}>Queue is empty — play something.</Text>}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center", marginBottom: 12 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  title: { color: C.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  shuf: { flexDirection: "row", alignItems: "center", gap: 6, padding: 6 },
  shufText: { color: C.neutral, fontWeight: "700", fontSize: 13 },
  shufOn: { color: C.accent },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10 },
  active: { backgroundColor: "rgba(188,140,242,0.08)", borderRadius: 10, paddingHorizontal: 6, marginHorizontal: -6 },
  art: { width: 46, height: 46, borderRadius: 10, backgroundColor: "#222" },
  mid: { flex: 1 },
  name: { color: C.text, fontWeight: "600", fontSize: 14 },
  nameOn: { color: C.accent },
  sub: { color: C.textDim, fontSize: 12, marginTop: 2 },
  rm: { padding: 6 },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 16 },
});
