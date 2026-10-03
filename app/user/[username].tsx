import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getProfile, resolveUsernameToUid, type Profile } from "../../lib/usernames";
import { loadUserPublicPlaylists } from "../../lib/cloud";
import type { Playlist } from "../../lib/playlists";
import { PlaylistRow } from "../../components/PlaylistRow";
import { SectionTitle } from "../../components/SectionTitle";
import { C } from "../../lib/theme";

export default function UserProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const name = decodeURIComponent(String(username ?? ""));
        const id = await resolveUsernameToUid(name);
        if (!id) {
          if (live) setMissing(true);
          return;
        }
        const [p, pls] = await Promise.all([getProfile(id), loadUserPublicPlaylists(id)]);
        if (!live) return;
        setUid(id);
        setProfile(p);
        setPlaylists(pls);
      } catch {
        if (live) setMissing(true);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [username]);

  const display = profile?.username ?? decodeURIComponent(String(username ?? ""));

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
        <Ionicons name="arrow-back" size={24} color={C.text} />
      </Pressable>
      {loading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : missing || !uid ? (
        <Text style={s.empty}>User not found.</Text>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={
            <View>
              <View style={s.card}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{(display.trim()[0] ?? "?").toUpperCase()}</Text>
                </View>
                <Text style={s.name}>{display}</Text>
                <Text style={s.sub}>{playlists.length} public playlists</Text>
              </View>
              <SectionTitle title="Public playlists" icon="globe-outline" color={C.accent} size={18} />
            </View>
          }
          renderItem={({ item }) => <PlaylistRow pl={item} ownerUid={uid} />}
          ListEmptyComponent={<Text style={s.empty}>No public playlists yet.</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  back: { paddingHorizontal: 16, paddingVertical: 4, alignSelf: "flex-start" },
  card: { alignItems: "center", paddingVertical: 12 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.onAccent, fontSize: 34, fontWeight: "900" },
  name: { color: C.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.5, marginTop: 12 },
  sub: { color: C.textDim, marginTop: 4 },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 30 },
});
