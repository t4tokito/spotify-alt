import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { authErrorMessage, useAuth } from "../lib/auth";
import { usePlayer } from "../lib/player";
import { usePlaylists } from "../lib/playlists";
import { SongRow } from "../components/SongRow";
import { PLAYLIST_ICONS } from "../lib/playlistIcons";
import type { Playlist } from "../lib/playlists";
import { AVATARS, AVATAR_KEYS } from "../lib/avatars";
import { getFollowers, getFollowing } from "../lib/cloud";
import { C, tint } from "../lib/theme";

type Tab = "playlists" | "liked" | "history";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, user, signOut, updateUsername, updatePhoto } = useAuth();
  const { liked, history, play } = usePlayer();
  const { playlists } = usePlaylists();

  const name = profile?.username ?? "Music Lover";
  const initial = (name.trim()[0] ?? "M").toUpperCase();
  const avatarSrc = profile?.photoURL ? AVATARS[profile.photoURL] : null;
  const likedList = Object.values(liked);

  const [tab, setTab] = useState<Tab>("playlists");
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    let live = true;
    (async () => {
      try {
        const [fwers, fwing] = await Promise.all([
          getFollowers(user.uid).catch(() => []),
          getFollowing(user.uid).catch(() => []),
        ]);
        if (live) {
          setFollowersCount(fwers.length);
          setFollowingCount(fwing.length);
        }
      } catch {}
    })();
    return () => {
      live = false;
    };
  }, [user?.uid]);

  function openEdit() {
    setNewName(name === "Music Lover" ? "" : name);
    setTempAvatar(profile?.photoURL ?? null);
    setNameError("");
    setEditOpen(true);
  }

  async function saveEdit() {
    setNameError("");
    setBusy(true);
    try {
      const nn = newName.trim();
      if (nn && nn !== name) await updateUsername(nn);
      if (tempAvatar && tempAvatar !== profile?.photoURL) await updatePhoto(tempAvatar);
      setEditOpen(false);
    } catch (e) {
      setNameError(authErrorMessage(e));
    }
    setBusy(false);
  }

  const tabData =
    tab === "playlists" ? null : tab === "liked" ? likedList : history;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <Text style={s.topName}>{name}</Text>
        <Pressable onPress={signOut} hitSlop={10} style={s.topBtn}>
          <Ionicons name="log-out-outline" size={24} color={C.text} />
        </Pressable>
      </View>

      <FlatList
        key={tab}
        data={tab === "playlists" ? [] : tabData ?? []}
        keyExtractor={(i: any) => `t-${i.id}`}
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
                      <Text style={s.avatarText}>{initial}</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
              <Pressable onPress={() => router.push("/playlists" as any)} style={s.stat}>
                <Text style={s.statNum}>{playlists.length}</Text>
                <Text style={s.statLabel}>playlists</Text>
              </Pressable>
              <Pressable onPress={() => router.push(`/follows?type=followers&uid=${user?.uid}` as any)} style={s.stat}>
                <Text style={s.statNum}>{followersCount}</Text>
                <Text style={s.statLabel}>followers</Text>
              </Pressable>
              <Pressable onPress={() => router.push(`/follows?type=following&uid=${user?.uid}` as any)} style={s.stat}>
                <Text style={s.statNum}>{followingCount}</Text>
                <Text style={s.statLabel}>following</Text>
              </Pressable>
            </View>
            <Text style={s.displayName}>{name}</Text>
            {!!(profile?.email ?? user?.email) && (
              <Text style={s.bio}>{profile?.email ?? user?.email}</Text>
            )}
            <View style={s.btnRow}>
              <Pressable onPress={openEdit} style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.75 }]}>
                <Text style={s.editText}>Edit profile</Text>
              </Pressable>
              <Pressable onPress={() => router.push("/stats" as any)} style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.75 }]}>
                <Ionicons name="stats-chart-outline" size={16} color={C.text} />
                <Text style={s.editText}>Stats</Text>
              </Pressable>
            </View>
            <View style={s.tabs}>
              {(
                [
                  { k: "playlists", icon: "grid-outline" },
                  { k: "liked", icon: "heart-outline" },
                  { k: "history", icon: "time-outline" },
                ] as const
              ).map((t) => (
                <Pressable
                  key={t.k}
                  onPress={() => setTab(t.k)}
                  style={[s.tab, tab === t.k && s.tabOn]}
                >
                  <Ionicons
                    name={(tab === t.k ? t.icon.replace("-outline", "") : t.icon) as any}
                    size={24}
                    color={tab === t.k ? C.text : C.neutral}
                  />
                </Pressable>
              ))}
            </View>
            {tab === "playlists" && (
              <View style={s.spotWrap}>
                {playlists.map((pl: Playlist) => (
                  <Pressable
                    key={pl.id}
                    onPress={() => router.push(`/playlist/${pl.id}` as any)}
                    style={({ pressed }) => [s.spot, pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] }]}
                  >
                    {pl.icon && PLAYLIST_ICONS[pl.icon] ? (
                      <Image source={PLAYLIST_ICONS[pl.icon]} resizeMode="cover" style={s.spotArt} />
                    ) : pl.songs?.[0]?.image ? (
                      <Image source={{ uri: pl.songs[0].image }} style={s.spotArt} />
                    ) : (
                      <View style={[s.spotArt, s.spotEmpty]}>
                        <Ionicons name="musical-notes" size={30} color={C.accent} />
                      </View>
                    )}
                    <View style={s.spotMid}>
                      <Text numberOfLines={1} style={s.spotName}>{pl.name}</Text>
                      <Text style={s.spotSub}>{pl.songs.length} songs</Text>
                      <View style={[s.visPill, (pl.visibility ?? "private") === "public" && s.visOn]}>
                        <Ionicons
                          name={(pl.visibility ?? "private") === "public" ? "globe-outline" : "lock-closed-outline"}
                          size={11}
                          color={(pl.visibility ?? "private") === "public" ? C.onAccent : C.textDim}
                        />
                        <Text style={[s.visText, (pl.visibility ?? "private") === "public" && s.visTextOn]}>
                          {(pl.visibility ?? "private") === "public" ? "Public" : "Private"}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => pl.songs.length > 0 && play(pl.songs[0], pl.songs)}
                      hitSlop={8}
                      style={s.spotPlay}
                    >
                      <Ionicons name="play" size={20} color={C.onAccent} />
                    </Pressable>
                  </Pressable>
                ))}
                {playlists.length === 0 && <Text style={s.empty}>No playlists yet.</Text>}
              </View>
            )}
          </View>
        }
        renderItem={({ item }: any) => (
          <SongRow song={item} queue={tab === "liked" ? likedList : history} />
        )}
        ListEmptyComponent={
          tab === "playlists" ? null : (
            <Text style={s.empty}>
              {tab === "liked" ? "Nothing liked yet." : "Nothing played yet."}
            </Text>
          )
        }
      />

      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <Pressable style={s.back} onPress={() => setEditOpen(false)} />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Edit profile</Text>
          <View style={s.avatarGrid}>
            {AVATAR_KEYS.map((k) => (
              <Pressable
                key={k}
                onPress={() => setTempAvatar(k)}
                style={[s.pick, tempAvatar === k && s.pickSel]}
              >
                <Image source={AVATARS[k]} style={s.pickImg} />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Username (5-15 characters)"
            placeholderTextColor="#777"
            style={s.input}
            autoCapitalize="none"
          />
          {!!nameError && <Text style={s.error}>{nameError}</Text>}
          <Pressable onPress={saveEdit} disabled={busy} style={[s.saveBtn, busy && { opacity: 0.7 }]}>
            {busy ? (
              <ActivityIndicator color={C.onAccent} />
            ) : (
              <Text style={s.saveText}>Save</Text>
            )}
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingBottom: 6 },
  topName: { flex: 1, textAlign: "center", color: C.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.3, marginLeft: 34 },
  topBtn: { padding: 6, width: 34 },
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
  bio: { color: C.textDim, fontSize: 13, paddingHorizontal: 16, marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 12 },
  editBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: C.surface2, borderRadius: 10, paddingVertical: 10,
  },
  editText: { color: C.text, fontWeight: "700", fontSize: 14 },
  tabs: { flexDirection: "row", marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "transparent" },
  tabOn: { borderBottomColor: C.text },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 30 },
  spotWrap: { paddingHorizontal: 16, gap: 12, paddingTop: 4 },
  spot: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.surface, borderRadius: 18, padding: 12,
  },
  spotArt: { width: 84, height: 84, borderRadius: 14, backgroundColor: C.surface2 },
  spotEmpty: { alignItems: "center", justifyContent: "center" },
  spotMid: { flex: 1, gap: 4 },
  spotName: { color: C.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  spotSub: { color: C.textDim, fontSize: 13, fontWeight: "600" },
  visPill: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 2,
  },
  visOn: { backgroundColor: C.accent, borderColor: C.accent },
  visText: { color: C.textDim, fontSize: 11, fontWeight: "700" },
  visTextOn: { color: C.onAccent },
  spotPlay: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
  },
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center" },
  sheetTitle: { color: C.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  pick: { borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  pickSel: { borderColor: C.accent },
  pickImg: { width: 80, height: 80, borderRadius: 14, backgroundColor: C.surface2 },
  input: { backgroundColor: C.surface2, borderRadius: 12, padding: 14, color: C.text, fontSize: 16 },
  error: { color: C.danger, fontSize: 13, textAlign: "center" },
  saveBtn: { backgroundColor: C.accent, borderRadius: 24, paddingVertical: 14, alignItems: "center" },
  saveText: { color: C.onAccent, fontWeight: "800", fontSize: 15 },
});
