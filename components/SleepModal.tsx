import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "../lib/player";
import { C } from "../lib/theme";

const OPTIONS: { label: string; value: number | "track" | null }[] = [
  { label: "Off", value: null },
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "End of track", value: "track" },
];

export function SleepModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { sleepLeft, setSleepTimer } = usePlayer();

  function pick(v: number | "track" | null) {
    setSleepTimer(v);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.back} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.handle} />
        <Text style={s.title}>Sleep timer</Text>
        {sleepLeft !== null && (
          <Text style={s.left}>
            {sleepLeft >= 60
              ? `${Math.floor(sleepLeft / 60)} min left`
              : `${sleepLeft} sec left`}
          </Text>
        )}
        {OPTIONS.map((o) => (
          <Pressable key={o.label} onPress={() => pick(o.value)} style={s.row}>
            <Ionicons
              name={o.value === null ? "close-circle-outline" : o.value === "track" ? "musical-note-outline" : "moon-outline"}
              size={20}
              color={C.neutral}
            />
            <Text style={s.label}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center", marginBottom: 12 },
  title: { color: C.text, fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 4 },
  left: { color: C.accent, textAlign: "center", fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 8 },
  label: { color: C.text, fontSize: 16, fontWeight: "600" },
});
