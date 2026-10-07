import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getFollowers, getFollowing, type FollowDoc } from "../lib/cloud";
import { AVATARS } from "../lib/avatars";
import { usePeerPhoto } from "../lib/usePeerPhoto";
import { C } from "../lib/theme";

function FollowRow({ item }: { item: FollowDoc }) {
  const router = useRouter();
  const photoKey = usePeerPhoto(item.uid, item.photoURL);
  const photo = photoKey ? AVATARS[photoKey] : null;
  return (
    <Pressable
      onPress={() => router.push(`/user/${encodeURIComponent(item.username)}` as any)}
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
      <Ionicons name="chevron-forward" size={20} color={C.neutral} />
    </Pressable>
  );
}

export default function Follows() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type, uid } = useLocalSearchParams<{ type: string; uid: string }>();
  const [list, setList] = useState<FollowDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const isFollowers = type !== "following";

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = isFollowers ? await getFollowers(String(uid)) : await getFollowing(String(uid));
        if (live) setList(res);
      } catch {}
      if (live) setLoading(false);
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, uid]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={s.title}>{isFollowers ? "Followers" : "Following"}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(u) => u.uid}
          renderItem={({ item }) => <FollowRow item={item} />}
          ListEmptyComponent={<Text style={s.empty}>Nobody here yet.</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  head: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 4 },
  back: { padding: 8 },
  title: { color: C.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.surface2, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.accent, fontSize: 20, fontWeight: "800" },
  avatarImg: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.surface2 },
  name: { flex: 1, color: C.text, fontSize: 16, fontWeight: "700" },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 30 },
});
