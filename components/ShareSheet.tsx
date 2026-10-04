import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";
import { getMyChats, peerOf, sendPlaylist, sendSong, type ChatDoc } from "../lib/chat";
import type { Song } from "../lib/music";
import { AVATARS } from "../lib/avatars";
import { C, tint } from "../lib/theme";

export type SharePayload =
  | { type: "song"; song: Song }
  | { type: "playlist"; playlist: { id: string; ownerUid: string; name: string; songCount: number } };

export function ShareSheet({
  visible,
  payload,
  onClose,
  onSent,
}: {
  visible: boolean;
  payload: SharePayload | null;
  onClose: () => void;
  onSent?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<(ChatDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !user?.uid) return;
    setLoading(true);
    getMyChats(user.uid)
      .then(setChats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, user?.uid]);

  async function send(chatId: string) {
    if (!payload || !user) return;
    try {
      if (payload.type === "song") {
        await sendSong(chatId, { uid: user.uid, username: profile?.username ?? "Me" }, payload.song);
      } else {
        await sendPlaylist(chatId, { uid: user.uid, username: profile?.username ?? "Me" }, payload.playlist);
      }
      setSentId(chatId);
      setTimeout(() => {
        setSentId(null);
        onClose();
        onSent?.();
      }, 600);
    } catch {}
  }

  const title = payload?.type === "song" ? payload.song.name : payload?.type === "playlist" ? payload.playlist.name : "";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.back} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.handle} />
        <Text style={s.title}>Share</Text>
        <Text numberOfLines={1} style={s.sub}>{title}</Text>
        {loading ? (
          <ActivityIndicator color={C.accent} style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(c) => c.id}
            style={{ maxHeight: 340 }}
            renderItem={({ item }) => {
              const peer = peerOf(item, user?.uid ?? "");
              const photo = peer.photoURL ? AVATARS[peer.photoURL] : null;
              return (
                <Pressable onPress={() => send(item.id)} style={s.row}>
                  {photo ? (
                    <Image source={photo} style={s.avatarImg} />
                  ) : (
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>{(peer.username[0] ?? "?").toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={s.name}>{peer.username}</Text>
                  {sentId === item.id ? (
                    <Ionicons name="checkmark-circle" size={22} color={C.accent} />
                  ) : (
                    <Ionicons name="send-outline" size={20} color={C.neutral} />
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={s.empty}>No chats yet.</Text>
                <Text style={s.emptySub}>Message someone from their profile first.</Text>
              </View>
            }
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
  title: { color: C.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
  sub: { color: C.textDim, fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 9, gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: tint(C.accent, 0.2), alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.accent, fontSize: 19, fontWeight: "800" },
  avatarImg: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.surface2 },
  name: { flex: 1, color: C.text, fontSize: 16, fontWeight: "700" },
  emptyWrap: { alignItems: "center", marginVertical: 16, gap: 4 },
  empty: { color: C.text, fontWeight: "700" },
  emptySub: { color: C.textFaint, fontSize: 13 },
});
