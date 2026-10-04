import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth";
import { peerOf, subscribeMyChats, type ChatDoc } from "../lib/chat";
import { AVATARS } from "../lib/avatars";
import { C, tint } from "../lib/theme";

export default function Messages() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState<(ChatDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

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
      {loading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => {
            const peer = peerOf(item, user?.uid ?? "");
            const photo = peer.photoURL ? AVATARS[peer.photoURL] : null;
            return (
              <Pressable
                onPress={() => router.push(`/chat/${item.id}` as any)}
                style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}
              >
                {photo ? (
                  <Image source={photo} style={s.avatarImg} />
                ) : (
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{(peer.username[0] ?? "?").toUpperCase()}</Text>
                  </View>
                )}
                <View style={s.mid}>
                  <Text style={s.name}>{peer.username}</Text>
                  <Text numberOfLines={1} style={s.preview}>
                    {item.lastText || "Say hi!"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.neutral} />
              </Pressable>
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
  title: { color: C.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.6, paddingHorizontal: 16, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 9, paddingHorizontal: 16, gap: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: tint(C.accent, 0.2), alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.accent, fontSize: 20, fontWeight: "800" },
  avatarImg: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.surface2 },
  mid: { flex: 1 },
  name: { color: C.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  preview: { color: C.textDim, fontSize: 13, marginTop: 2 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 8, paddingHorizontal: 32 },
  emptyTile: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: tint(C.accent, 0.15), alignItems: "center", justifyContent: "center",
  },
  empty: { color: C.text, fontWeight: "800", fontSize: 16 },
  emptySub: { color: C.textFaint, textAlign: "center", lineHeight: 20 },
});
