import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { usePlayer } from "../../lib/player";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { peerOf, sendText, subscribeMessages, healChatPhotos, type ChatDoc, type ChatMsg } from "../../lib/chat";
import { AVATARS } from "../../lib/avatars";
import { C } from "../../lib/theme";

export default function ChatThread() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { play } = usePlayer();
  const [chat, setChat] = useState<ChatDoc | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let live = true;
    getDoc(doc(db, "chats", String(id)))
      .then((d) => {
        if (!live || !d.exists()) return;
        const c = d.data() as ChatDoc;
        setChat(c);
        if (user?.uid) {
          const peerUid = (c.participants ?? []).find((p) => p !== user.uid) ?? "";
          healChatPhotos(String(id), user.uid, profile?.photoURL ?? null, peerUid).catch(() => {});
        }
      })
      .catch(() => {});
    const unsub = subscribeMessages(String(id), (ms) => {
      if (live) {
        setMsgs(ms);
        setTimeout(() => {
          try {
            listRef.current?.scrollToEnd({ animated: true });
          } catch {}
        }, 100);
      }
    });
    return () => {
      live = false;
      unsub();
    };
  }, [id]);

  const peer = chat ? peerOf(chat, user?.uid ?? "") : null;
  const photo = peer?.photoURL ? AVATARS[peer.photoURL] : null;

  async function send() {
    if (!text.trim() || sending || !user) return;
    setSending(true);
    try {
      await sendText(String(id), { uid: user.uid, username: profile?.username ?? "Me" }, text);
      setText("");
    } catch {}
    setSending(false);
  }

  function openMsg(m: ChatMsg) {
    if (m.kind === "song" && m.song) {
      play(m.song, [m.song]);
      router.push("/player");
    } else if (m.kind === "playlist" && m.playlist) {
      router.push(`/playlist/${m.playlist.id}?owner=${m.playlist.ownerUid}` as any);
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        {photo ? (
          <Image source={photo} style={s.avatarImg} />
        ) : (
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(peer?.username?.[0] ?? "?").toUpperCase()}</Text>
          </View>
        )}
        <Text style={s.name}>{peer?.username ?? "Chat"}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        ListEmptyComponent={<Text style={s.empty}>No messages yet — say hi or share a song.</Text>}
        renderItem={({ item }) => {
          const mine = item.from === user?.uid;
          return (
            <View style={[s.row, mine ? s.rowMine : s.rowTheirs]}>
              {item.kind === "text" ? (
                <View style={[s.bubble, mine ? s.bMine : s.bTheirs]}>
                  <Text style={[s.bText, mine && s.bTextMine]}>{item.text}</Text>
                </View>
              ) : item.kind === "song" && item.song ? (
                <Pressable onPress={() => openMsg(item)} style={s.card}>
                  <Image source={{ uri: item.song.imageSmall || item.song.image }} style={s.art} />
                  <View style={s.cardMid}>
                    <Text numberOfLines={1} style={s.cardTitle}>{item.song.name}</Text>
                    <Text numberOfLines={1} style={s.cardSub}>{item.song.artists}</Text>
                    <View style={s.tapRow}>
                      <Ionicons name="play-circle" size={15} color={C.accent} />
                      <Text style={s.tap}>Tap to play</Text>
                    </View>
                  </View>
                </Pressable>
              ) : item.kind === "playlist" && item.playlist ? (
                <Pressable onPress={() => openMsg(item)} style={s.card}>
                  <View style={s.plArt}>
                    <Ionicons name="musical-notes" size={24} color={C.accent} />
                  </View>
                  <View style={s.cardMid}>
                    <Text numberOfLines={1} style={s.cardTitle}>{item.playlist.name}</Text>
                    <Text numberOfLines={1} style={s.cardSub}>{item.playlist.songCount} songs • Playlist</Text>
                    <View style={s.tapRow}>
                      <Ionicons name="open-outline" size={15} color={C.accent} />
                      <Text style={s.tap}>Tap to open</Text>
                    </View>
                  </View>
                </Pressable>
              ) : null}
            </View>
          );
        }}
      />

      <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message…"
          placeholderTextColor="#777"
          style={s.input}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable onPress={send} disabled={sending || !text.trim()} style={[s.send, (!text.trim() || sending) && s.sendOff]}>
          <Ionicons name="send" size={18} color={C.onAccent} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  head: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 8, gap: 8 },
  back: { padding: 8 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.surface2, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.accent, fontSize: 17, fontWeight: "800" },
  avatarImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface2 },
  name: { color: C.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  row: { flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bMine: { backgroundColor: C.accent, borderBottomRightRadius: 6 },
  bTheirs: { backgroundColor: C.surface2, borderBottomLeftRadius: 6 },
  bText: { color: "#fff", fontSize: 15, lineHeight: 20 },
  bTextMine: { color: "#141414" },
  card: { flexDirection: "row", alignItems: "center", gap: 10, maxWidth: "80%", borderRadius: 16, padding: 10, backgroundColor: C.surface2 },
  art: { width: 52, height: 52, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.25)" },
  plArt: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center",
  },
  cardMid: { flex: 1 },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cardSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  tapRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  tap: { color: C.accent, fontSize: 12, fontWeight: "700" },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 40 },
  composer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  input: { flex: 1, backgroundColor: C.surface2, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, color: C.text, fontSize: 15 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  sendOff: { opacity: 0.4 },
});
