import { useState } from "react";
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "../lib/player";
import { usePlaylists } from "../lib/playlists";
import { sendPlaylist, sendSong } from "../lib/chat";
import type { Song } from "../lib/music";
import { C } from "../lib/theme";

type Tab = "songs" | "playlists";

export function ChatShareModal({
  visible,
  chatId,
  participants,
  from,
  onClose,
}: {
  visible: boolean;
  chatId: string;
  participants: string[];
  from: { uid: string; username: string };
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { liked } = usePlayer();
  const { playlists } = usePlaylists();
  const [tab, setTab] = useState<Tab>("songs");
  const likedList = Object.values(liked);

  async function shareSong(song: Song) {
    try {
      await sendSong(chatId, participants, from, song);
    } catch {}
    onClose();
  }

  async function sharePlaylist(id: string, name: string, songCount: number) {
    try {
      await sendPlaylist(chatId, participants, from, { id, ownerUid: from.uid, name, songCount });
    } catch {}
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.back} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.handle} />
        <Text style={s.title}>Share to chat</Text>
        <View style={s.tabs}>
          {(["songs", "playlists"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[s.tab, tab === t && s.tabOn]}
            >
              <Text style={[s.tabText, tab === t && s.tabTextOn]}>
                {t === "songs" ? "Liked songs" : "Playlists"}
              </Text>
            </Pressable>
          ))}
        </View>
        {tab === "songs" ? (
          <FlatList
            data={likedList}
            keyExtractor={(i) => i.id}
            style={{ maxHeight: 380 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => shareSong(item)} style={s.row}>
                <Image source={{ uri: item.imageSmall || item.image }} style={s.art} />
                <View style={s.mid}>
                  <Text numberOfLines={1} style={s.name}>{item.name}</Text>
                  <Text numberOfLines={1} style={s.sub}>{item.artists}</Text>
                </View>
                <Ionicons name="send-outline" size={20} color={C.neutral} />
              </Pressable>
            )}
            ListEmptyComponent={<Text style={s.empty}>No liked songs yet — tap the heart on any song.</Text>}
          />
        ) : (
          <FlatList
            data={playlists}
            keyExtractor={(p) => p.id}
            style={{ maxHeight: 380 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => sharePlaylist(item.id, item.name, item.songs.length)} style={s.row}>
                <View style={s.plArt}>
                  <Ionicons name="musical-notes" size={20} color={C.accent} />
                </View>
                <View style={s.mid}>
                  <Text numberOfLines={1} style={s.name}>{item.name}</Text>
                  <Text style={s.sub}>{item.songs.length} songs</Text>
                </View>
                <Ionicons name="send-outline" size={20} color={C.neutral} />
              </Pressable>
            )}
            ListEmptyComponent={<Text style={s.empty}>No playlists yet.</Text>}
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
  title: { color: C.text, fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tab: { flex: 1, backgroundColor: C.surface2, borderRadius: 18, paddingVertical: 9, alignItems: "center" },
  tabOn: { backgroundColor: C.accent },
  tabText: { color: C.textDim, fontWeight: "800", fontSize: 14 },
  tabTextOn: { color: C.onAccent },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12 },
  art: { width: 48, height: 48, borderRadius: 10, backgroundColor: C.surface2 },
  plArt: {
    width: 48, height: 48, borderRadius: 10, backgroundColor: C.surface2,
    alignItems: "center", justifyContent: "center",
  },
  mid: { flex: 1 },
  name: { color: C.text, fontWeight: "600", fontSize: 15 },
  sub: { color: C.textDim, fontSize: 12, marginTop: 2 },
  empty: { color: C.textFaint, textAlign: "center", marginVertical: 20 },
});
