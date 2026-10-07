import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth";
import { findOrCreateChat, peerOf, subscribeMyChats, type ChatDoc } from "../lib/chat";
import { FoundUser, searchUsernames } from "../lib/usernames";
import { AVATARS } from "../lib/avatars";
import { usePeerPhoto } from "../lib/usePeerPhoto";
import { C, tint } from "../lib/theme";

function ChatRow({ chatId, peerUid, peerName, mappingPhoto, lastText, unread, meUid }: {
  chatId: string;
  peerUid: string;
  peerName: string;
  mappingPhoto?: string | null;
  lastText: string;
  unread: number;
  meUid: string;
}) {
  const router = useRouter();
  const photoKey = usePeerPhoto(peerUid, mappingPhoto);
  const photo = photoKey ? AVATARS[photoKey] : null;
  return (
    <Pressable
      onPress={() => router.push(`/chat/${chatId}` as any)}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}
    >
      {photo ? (
        <Image source={photo} style={s.avatarImg} />
      ) : (
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(peerName[0] ?? "?").toUpperCase()}</Text>
        </View>
      )}
      <View style={s.mid}>
        <Text style={[s.name, unread > 0 && s.nameNew]}>{peerName}</Text>
        <Text numberOfLines={1} style={[s.preview, unread > 0 && s.previewNew]}>
          {lastText || "Say hi!"}
        </Text>
      </View>
      {unread > 0 ? (
        <View style={s.badge}>
          <Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={C.neutral} />
      )}
    </Pressable>
  );
}

export default function Messages() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<(ChatDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);

  async function doSearch(query: string) {
    setQ(query);
    if (!query.trim()) {
      setPeople([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchUsernames(query, 12);
      setPeople(res.filter((p) => p.uid !== user?.uid));
    } catch {
      setPeople([]);
    }
    setSearching(false);
  }

  async function openChatWith(p: FoundUser) {
    if (!user) return;
    try {
      const chatId = await findOrCreateChat(
        { uid: user.uid, username: profile?.username ?? "Me", photoURL: profile?.photoURL ?? null },
        { uid: p.uid, username: p.username, photoURL: p.photoURL ?? null }
      );
      setQ("");
      setPeople([]);
      router.push(`/chat/${chatId}` as any);
    } catch (e) {
      console.warn("open chat failed:", e);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const unsub = subscribeMyChats(user.uid, (cs) => {
        setChats(cs);
        setLoading(false);
      });
      return unsub;
    }, [user?.uid])
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Text style={s.title}>Messages</Text>
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={C.neutral} />
        <TextInput
          value={q}
          onChangeText={doSearch}
          placeholder="Search people to message…"
          placeholderTextColor="#777"
          style={s.search}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searching && <ActivityIndicator color={C.accent} size="small" />}
      </View>
      {q.trim() ? (
        <FlatList
          data={people}
          keyExtractor={(p) => p.uid}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const photo = item.photoURL ? AVATARS[item.photoURL] : null;
            return (
              <Pressable
                onPress={() => openChatWith(item)}
                style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}
              >
                {photo ? (
                  <Image source={photo} style={s.avatarImg} />
                ) : (
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{(item.username[0] ?? "?").toUpperCase()}</Text>
                  </View>
                )}
                <Text style={s.name}>{item.username}</Text>
                <Ionicons name="chatbubble-outline" size={20} color={C.accent} />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            !searching ? <Text style={s.emptyNote}>No users found.</Text> : null
          }
        />
      ) : loading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => {
            const peer = peerOf(item, user?.uid ?? "");
            return (
              <ChatRow
                chatId={item.id}
                peerUid={peer.uid}
                peerName={peer.username}
                mappingPhoto={peer.photoURL}
                lastText={item.lastText}
                unread={item.unread?.[user?.uid ?? ""] ?? 0}
                meUid={user?.uid ?? ""}
              />
            );
          }}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <View style={s.emptyTile}>
                <Ionicons name="chatbubbles-outline" size={30} color={C.accent} />
              </View>
              <Text style={s.empty}>No chats yet.</Text>
              <Text style={s.emptySub}>Search people, open a profile and tap Message.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  title: { color: C.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.6, paddingHorizontal: 16, marginBottom: 10 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.surface2, borderRadius: 12, paddingHorizontal: 12,
    marginHorizontal: 16, marginBottom: 6,
  },
  search: { flex: 1, paddingVertical: 12, color: C.text, fontSize: 15 },
  emptyNote: { color: C.textFaint, textAlign: "center", marginTop: 30 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 9, paddingHorizontal: 16, gap: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: tint(C.accent, 0.2), alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.accent, fontSize: 20, fontWeight: "800" },
  avatarImg: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.surface2 },
  mid: { flex: 1 },
  name: { color: C.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  nameNew: { fontWeight: "900" },
  preview: { color: C.textDim, fontSize: 13, marginTop: 2 },
  previewNew: { color: C.text, fontWeight: "600" },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: C.onAccent, fontSize: 12, fontWeight: "800" },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 8, paddingHorizontal: 32 },
  emptyTile: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: tint(C.accent, 0.15), alignItems: "center", justifyContent: "center",
  },
  empty: { color: C.text, fontWeight: "800", fontSize: 16 },
  emptySub: { color: C.textFaint, textAlign: "center", lineHeight: 20 },
});
