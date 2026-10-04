import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getProfile, resolveUsernameToUid, type Profile } from "../../lib/usernames";
import { findOrCreateChat } from "../../lib/chat";
import { followUser, getFollowers, getFollowing, isFollowing, loadUserPublicPlaylists, unfollowUser } from "../../lib/cloud";
import { useAuth } from "../../lib/auth";
import { AVATARS } from "../../lib/avatars";
import type { Playlist } from "../../lib/playlists";
import { SpotlightCard } from "../../components/SpotlightCard";
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

  async function openChat() {
    if (!me?.uid || !uid || isSelf) return;
    try {
      const chatId = await findOrCreateChat(
        { uid: me.uid, username: myProfile?.username ?? "Me", photoURL: myProfile?.photoURL ?? null },
        { uid, username: display, photoURL: profile?.photoURL ?? null }
      );
      router.push(`/chat/${chatId}` as any);
    } catch (e) {
      console.warn("open chat failed:", e);
    }
  }

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
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.topBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={s.topName}>{display}</Text>
        <View style={s.topBtn} />
      </View>
      {loading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : missing || !uid ? (
        <Text style={s.empty}>User not found.</Text>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => "x"}
          ListHeaderComponent={
            <View>
              <View style={s.head}>
                <LinearGradient
                  colors={[C.accent, "#FF5C7A", "#FF9F43"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.ring}
                >
                  <View style={s.ringInner}>
                    {avatarSrc ? (
                      <Image source={avatarSrc} style={s.avatarImg} />
                    ) : (
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>{(display.trim()[0] ?? "?").toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
                <View style={s.stat}>
                  <Text style={s.statNum}>{playlists.length}</Text>
                  <Text style={s.statLabel}>playlists</Text>
                </View>
                <Pressable onPress={() => router.push(`/follows?type=followers&uid=${uid}` as any)} style={s.stat}>
                  <Text style={s.statNum}>{followersCount}</Text>
                  <Text style={s.statLabel}>followers</Text>
                </Pressable>
                <Pressable onPress={() => router.push(`/follows?type=following&uid=${uid}` as any)} style={s.stat}>
                  <Text style={s.statNum}>{followingCount}</Text>
                  <Text style={s.statLabel}>following</Text>
                </Pressable>
              </View>
              <Text style={s.displayName}>{display}</Text>
              {!isSelf && (
                <View style={s.btnRow}>
                  <Pressable
                    onPress={toggleFollow}
                    disabled={followBusy}
                    style={({ pressed }) => [s.followBtn, following && s.followOff, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={[s.followText, following && s.followTextOff]}>
                      {following ? "Following" : "Follow"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={openChat}
                    style={({ pressed }) => [s.followBtn, s.msgBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={C.text} />
                    <Text style={s.msgText}>Message</Text>
                  </Pressable>
                </View>
              )}
              <View style={s.spotWrap}>
                {playlists.map((pl) => (
                  <SpotlightCard key={pl.id} pl={pl} ownerUid={uid} />
                ))}
                {playlists.length === 0 && <Text style={s.empty}>No public playlists yet.</Text>}
              </View>
            </View>
          }
          renderItem={() => null}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 6 },
  topBtn: { padding: 6, width: 34 },
  topName: { flex: 1, textAlign: "center", color: C.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  head: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, gap: 4 },
  ring: { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center" },
  ringInner: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  avatar: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.onAccent, fontSize: 30, fontWeight: "900" },
  avatarImg: { width: 78, height: 78, borderRadius: 39, backgroundColor: C.surface2 },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statNum: { color: C.text, fontSize: 17, fontWeight: "800" },
  statLabel: { color: C.textDim, fontSize: 12 },
  displayName: { color: C.text, fontSize: 15, fontWeight: "800", paddingHorizontal: 16, marginTop: 10 },
  btnRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 12 },
  followBtn: { flex: 1, backgroundColor: C.accent, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  msgBtn: { flex: 1, flexDirection: "row", backgroundColor: C.surface2, borderRadius: 10, paddingVertical: 10, alignItems: "center", justifyContent: "center", gap: 6 },
  msgText: { color: C.text, fontWeight: "800", fontSize: 14 },
  followOff: { backgroundColor: "transparent", borderWidth: 1, borderColor: C.neutral },
  followText: { color: C.onAccent, fontWeight: "800", fontSize: 14 },
  followTextOff: { color: C.text },
  spotWrap: { paddingHorizontal: 16, gap: 12, paddingTop: 14 },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 30 },
});
