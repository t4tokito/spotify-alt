import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, tint } from "../lib/theme";

/** iOS-style section header: tinted icon tile + tight-tracked title. */
export function SectionTitle({
  title,
  icon,
  color = C.neutral,
  size = 20,
  tight = false,
}: {
  title: string;
  icon?: string;
  color?: string;
  size?: number;
  tight?: boolean;
}) {
  if (!icon) {
    return <Text style={[s.title, { fontSize: size }, tight && s.tightTitle]}>{title}</Text>;
  }
  return (
    <View style={[s.row, tight && s.tightRow]}>
      <View style={[s.tile, { backgroundColor: tint(color, 0.18) }]}>
        <Ionicons name={icon as any} size={17} color={color} />
      </View>
      <Text style={[s.title, { fontSize: size }]}>{title}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  tile: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  title: { color: C.text, fontWeight: "800", letterSpacing: -0.4 },
  tightRow: { paddingHorizontal: 0, marginTop: 0, marginBottom: 0 },
  tightTitle: { paddingHorizontal: 0, marginTop: 0, marginBottom: 0 },
});
