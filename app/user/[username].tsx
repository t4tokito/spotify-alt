import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getProfile, resolveUsernameToUid, type Profile } from "../../lib/usernames";
import { followUser, getFollowers, getFollowing, isFollowing, loadUserPublicPlaylists, unfollowUser } from "../../lib/cloud";
import { useAuth } from "../../lib/auth";
import { AVATARS } from "../../lib/avatars";
import type { Playlist } from "../../lib/playlists";
import { PlaylistRow } from "../../components/PlaylistRow";
import { SectionTitle } from "../../components/SectionTitle";
import { C } from "../../lib/theme";

export default function UserProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user: me, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

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
        const [p, pls, fwers, fwing, amF] = await Promise.all([
          getProfile(id),
          loadUserPublicPlaylists(id),
          getFollowers(id).catch(() => []),
          getFollowing(id).catch(() => []),
          me?.uid && me.uid !== id ? isFollowing(me.uid, id).catch(() => false) : Promise.resolve(false),
        ]);
        if (!live) return;
        setUid(id);
        setProfile(p);
        setPlaylists(pls);
        setFollowersCount(fwers.length);
        setFollowingCount(fwing.length);
        setFollowing(!!amF);
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
  const avatarSrc = profile?.photoURL ? AVATARS[profile.photoURL] : null;
  const isSelf = me?.uid === uid;

  async function toggleFollow() {
    if (!me?.uid || !uid || isSelf || followBusy) return;
    setFollowBusy(true);
    try {
      if (following) {
        await unfollowUser(me.uid, uid);
        setFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        await followUser(
          me.uid,
          { username: myProfile?.username ?? "", photoURL: myProfile?.photoURL ?? null },
          { uid, username: display, photoURL: profile?.photoURL ?? null }
        );
        setFollowing(true);
        setFollowersCount((c) => c + 1);
      }
    } catch {}
    setFollowBusy(false);
  }

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
                {avatarSrc ? (
                  <Image source={avatarSrc} style={s.avatarImg} />
                ) : (
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{(display.trim()[0] ?? "?").toUpperCase()}</Text>
                  </View>
                )}
                <Text style={s.name}>{display}</Text>
                <View style={s.counts}>
                  <Pressable onPress={() => router.push(`/follows?type=followers&uid=${uid}` as any)}>
                    <Text style={s.countText}><Text style={s.countNum}>{followersCount}</Text> followers</Text>
                  </Pressable>
                  <Text style={s.dot}>•</Text>
                  <Pressable onPress={() => router.push(`/follows?type=following&uid=${uid}` as any)}>
                    <Text style={s.countText}><Text style={s.countNum}>{followingCount}</Text> following</Text>
                  </Pressable>
                </View>
                {!isSelf && (
                  <Pressable
                    onPress={toggleFollow}
                    disabled={followBusy}
                    style={({ pressed }) => [s.followBtn, following && s.followOff, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={[s.followText, following && s.followTextOff]}>
                      {following ? "Following" : "Follow"}
                    </Text>
                  </Pressable>
                )}
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
  avatarImg: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.surface2 },
  name: { color: C.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.5, marginTop: 12 },
  sub: { color: C.textDim, marginTop: 4 },
  counts: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  countText: { color: C.textDim, fontSize: 14 },
  countNum: { color: C.text, fontWeight: "800" },
  dot: { color: C.neutral },
  followBtn: {
    backgroundColor: C.accent, borderRadius: 20,
    paddingHorizontal: 32, paddingVertical: 10, marginTop: 14,
  },
  followOff: { backgroundColor: "transparent", borderWidth: 1, borderColor: C.neutral },
  followText: { color: C.onAccent, fontWeight: "800", fontSize: 15 },
  followTextOff: { color: C.text },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 30 },
});
