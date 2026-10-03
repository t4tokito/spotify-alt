import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Song } from "../lib/music";
import { getLyrics, type LyricLine } from "../lib/music";
import { usePlayer } from "../lib/player";
import { C } from "../lib/theme";

export function LyricsModal({
  visible,
  song,
  onClose,
}: {
  visible: boolean;
  song: Song;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { position } = usePlayer();
  const [lines, setLines] = useState<LyricLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible) return;
    setLines(null);
    setFailed(false);
    setLoading(true);
    getLyrics(song.id)
      .then((l) => {
        if (!l || l.length === 0) setFailed(true);
        else setLines(l);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [visible, song.id]);

  const synced = lines?.some((l) => l.t >= 0) ?? false;
  let activeIdx = -1;
  if (synced && lines) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].t <= position) activeIdx = i;
      else break;
    }
  }

  useEffect(() => {
    if (activeIdx >= 0) {
      try {
        listRef.current?.scrollToIndex({ index: activeIdx, viewPosition: 0.5, animated: true });
      } catch {}
    }
  }, [activeIdx]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.back} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.handle} />
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={s.title}>{song.name}</Text>
            <Text numberOfLines={1} style={s.sub}>{song.artists} • Lyrics</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={s.x}>
            <Ionicons name="close" size={22} color={C.textDim} />
          </Pressable>
        </View>
        {loading ? (
          <ActivityIndicator color={C.accent} size="large" style={{ marginVertical: 40 }} />
        ) : failed || !lines ? (
          <View style={s.emptyWrap}>
            <Ionicons name="mic-off-outline" size={32} color={C.neutral} />
            <Text style={s.empty}>Lyrics not available for this song.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={lines}
            keyExtractor={(_, i) => String(i)}
            style={{ maxHeight: 440 }}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item, index }) => (
              <Text style={[s.line, synced && index === activeIdx && s.lineOn, synced && index < activeIdx && s.linePast]}>
                {item.text}
              </Text>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center", marginBottom: 12 },
  head: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  title: { color: C.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  sub: { color: C.textDim, fontSize: 12, marginTop: 2 },
  x: { padding: 6 },
  line: { color: C.textDim, fontSize: 17, fontWeight: "600", lineHeight: 30, letterSpacing: -0.2 },
  lineOn: { color: C.text, fontSize: 20, fontWeight: "800" },
  linePast: { color: C.textFaint },
  emptyWrap: { alignItems: "center", gap: 10, paddingVertical: 40 },
  empty: { color: C.textFaint },
});
