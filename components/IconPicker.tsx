import { FlatList, Image, Pressable, StyleSheet } from "react-native";
import { PLAYLIST_ICON_KEYS, PLAYLIST_ICONS } from "../lib/playlistIcons";
import { C } from "../lib/theme";

export function IconPicker({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <FlatList
      horizontal
      data={PLAYLIST_ICON_KEYS}
      keyExtractor={(k) => k}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.list}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSelect(item)} style={[s.pick, selected === item && s.sel]}>
          <Image source={PLAYLIST_ICONS[item]} style={s.img} />
        </Pressable>
      )}
    />
  );
}

const s = StyleSheet.create({
  list: { gap: 10, paddingVertical: 4 },
  pick: { borderRadius: 22, borderWidth: 2, borderColor: "transparent" },
  sel: { borderColor: C.accent },
  img: { width: 44, height: 44, borderRadius: 20, backgroundColor: C.surface2 },
});
