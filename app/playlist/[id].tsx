import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "../../lib/player";
import { usePlaylists, type Playlist } from "../../lib/playlists";
import { loadPublicPlaylist } from "../../lib/cloud";
import { useAuth } from "../../lib/auth";
import { PLAYLIST_ICONS, PLAYLIST_ICON_KEYS } from "../../lib/playlistIcons";
import { SongRow } from "../../components/SongRow";
import { AddSongsModal } from "../../components/AddSongsModal";
import { ImportPlaylistModal } from "../../components/ImportPlaylistModal";
import { ShareSheet } from "../../components/ShareSheet";
import { C, tint } from "../../lib/theme";

function totalMins(songs: { duration: number }[]): string {
  const secs = songs.reduce((a, s) => a + (s.duration || 0), 0);
  const m = Math.round(secs / 60);
  return m < 1 ? "few sec" : `${m} min`;
}

function Cover({ icon, songs }: { icon?: string | null; songs: { image: string; imageSmall: string }[] }) {
  if (icon && PLAYLIST_ICONS[icon]) {
    return <Image source={PLAYLIST_ICONS[icon]} resizeMode="contain" style={s.cover} />;
  }
  const arts = songs.slice(0, 4);
  if (arts.length === 0) {
    return (
      <View style={[s.cover, s.coverEmpty]}>
        <Ionicons name="musical-notes" size={56} color={C.accent} />
      </View>
    );
  }
  if (arts.length < 4) {
    return <Image source={{ uri: arts[0].image }} style={s.cover} />;
  }
  return (
    <View style={s.cover}>
      {arts.map((a, i) => (
        <Image key={i} source={{ uri: a.imageSmall || a.image }} style={s.cell} />
      ))}
    </View>
  );
}

export default function PlaylistDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, owner } = useLocalSearchParams<{ id: string; owner?: string }>();
  const { play } = usePlayer();
  const { user } = useAuth();
  const { playlists, deletePlaylist, removeFromPlaylist, setPlaylistIcon, setVisibility, reorderPlaylist } = usePlaylists();
  const [addOpen, setAddOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [remote, setRemote] = useState<Playlist | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);

  const isMine = !owner || owner === user?.uid;
  const mine = playlists.find((p) => p.id === id);

  useEffect(() => {
    if (isMine || !owner) return;
    let live = true;
    setRemoteLoading(true);
    loadPublicPlaylist(owner, id)
      .then((p) => live && setRemote(p))
      .catch(() => live && setRemote(null))
      .finally(() => live && setRemoteLoading(false));
    return () => {
      live = false;
    };
  }, [isMine, owner, id]);

  const pl = isMine ? mine : remote;

  if (!pl) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        {remoteLoading ? (
          <ActivityIndicator color={C.accent} size="large" />
        ) : (
          <>
            <Text style={s.muted}>Playlist not found.</Text>
            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <Text style={s.backText}>Back</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const vis = pl.visibility ?? "private";

  function Header() {
    if (!pl) return null;
    return (
      <View style={s.header}>
            <Pressable onPress={() => isMine && setIconOpen(true)} style={s.coverWrap}>
              <Cover icon={pl.icon} songs={pl.songs} />
              {isMine && (
                <View style={s.editBadge}>
                  <Ionicons name="pencil" size={13} color={C.onAccent} />
                </View>
              )}
            </Pressable>
            <Text style={s.title}>{pl.name}</Text>
            <View style={s.metaRow}>
              <Text style={s.meta}>
                {pl.songs.length} songs • {totalMins(pl.songs)}
              </Text>
              {isMine ? (
                <Pressable
                  onPress={() => setVisibility(pl.id, vis === "public" ? "private" : "public")}
                  style={[s.visPill, vis === "public" && s.visPillOn]}
                >
                  <Ionicons
                    name={vis === "public" ? "globe-outline" : "lock-closed-outline"}
                    size={13}
                    color={vis === "public" ? C.onAccent : C.textDim}
                  />
                  <Text style={[s.visText, vis === "public" && s.visTextOn]}>
                    {vis === "public" ? "Public" : "Private"}
                  </Text>
                </Pressable>
              ) : (
                <View style={[s.visPill, s.visPillOn]}>
                  <Ionicons name="globe-outline" size={13} color={C.onAccent} />
                  <Text style={[s.visText, s.visTextOn]}>Public</Text>
                </View>
              )}
            </View>
            <View style={s.controls}>
              <Pressable
                onPress={() => pl.songs.length > 0 && play(pl.songs[0], pl.songs)}
                disabled={pl.songs.length === 0}
                style={({ pressed }) => [
                  s.playBtn,
                  pl.songs.length === 0 && s.disabled,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] },
                ]}
              >
                <Ionicons name="play" size={30} color={C.onAccent} />
              </Pressable>
              {isMine ? (
                <>
                  <Pressable
                    onPress={() => setAddOpen(true)}
                    hitSlop={10}
                    style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.55 }]}
                  >
                    <Ionicons name="add-circle-outline" size={28} color={C.textDim} />
                  </Pressable>
                  <Pressable
                    onPress={() => setShareOpen(true)}
                    hitSlop={10}
                    style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.55 }]}
                  >
                    <Ionicons name="share-outline" size={26} color={C.textDim} />
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Pressable
                    onPress={() => {
                      deletePlaylist(pl.id);
                      router.back();
                    }}
                    hitSlop={10}
                    style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.55 }]}
                  >
                    <Ionicons name="trash-outline" size={24} color={C.neutral} />
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => setSaveOpen(true)}
                    hitSlop={10}
                    style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="download-outline" size={18} color={C.onAccent} />
                    <Text style={s.saveText}>Save to Library</Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                </>
              )}
            </View>
          </View>
    );
  }

  const emptyText = <Text style={s.empty}>Empty playlist.</Text>;

  if (!isMine) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={[tint(C.accent, 0.28), "transparent"]} style={s.fade}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </Pressable>
        </LinearGradient>
        <FlatList
          data={pl.songs}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={<Header />}
          renderItem={({ item }) => <SongRow song={item} queue={pl.songs} />}
          ListEmptyComponent={emptyText}
        />
        <ImportPlaylistModal visible={saveOpen} songs={pl.songs} sourceName={pl.name} onClose={() => setSaveOpen(false)} />
      </View>
    );
  }
  // own playlist: draggable rows to reorder
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[tint(C.accent, 0.28), "transparent"]} style={s.fade}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
      </LinearGradient>
      <DraggableFlatList
        data={pl.songs}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={emptyText}
        onDragEnd={({ data }) => reorderPlaylist(pl.id, data)}
        activationDistance={12}
        renderItem={({ item, drag, isActive }) => (
          <Pressable
            onPress={() => play(item, pl.songs)}
            onLongPress={drag}
            delayLongPress={180}
            style={[s.dRow, isActive && s.dActive]}
          >
            <Image source={{ uri: item.imageSmall || item.image }} style={s.dArt} />
            <View style={s.dMid}>
              <Text numberOfLines={1} style={s.dTitle}>{item.name}</Text>
              <Text numberOfLines={1} style={s.dSub}>{item.artists}</Text>
            </View>
            <Pressable onPress={() => removeFromPlaylist(pl.id, item.id)} hitSlop={10} style={s.dIcon}>
              <Ionicons name="remove-circle-outline" size={20} color={C.neutral} />
            </Pressable>
            <Pressable onPressIn={drag} hitSlop={10} style={s.dIcon}>
              <Ionicons name="reorder-three-outline" size={22} color={C.neutral} />
            </Pressable>
          </Pressable>
        )}
      />
      <AddSongsModal visible={addOpen} playlistId={pl.id} playlistName={pl.name} onClose={() => setAddOpen(false)} />
      <ShareSheet
        visible={shareOpen}
        payload={{ type: "playlist", playlist: { id: pl.id, ownerUid: user?.uid ?? "", name: pl.name, songCount: pl.songs.length } }}
        onClose={() => setShareOpen(false)}
      />

      <Modal visible={iconOpen} transparent animationType="fade" onRequestClose={() => setIconOpen(false)}>
        <Pressable style={s.back2} onPress={() => setIconOpen(false)} />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <Text style={s.sheetTitle}>Playlist cover</Text>
          <View style={s.grid}>
            {PLAYLIST_ICON_KEYS.map((k) => {
              const selected = pl.icon === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => {
                    setPlaylistIcon(pl.id, k);
                    setIconOpen(false);
                  }}
                  style={[s.pick, selected && s.pickSelected]}
                >
                  <Image source={PLAYLIST_ICONS[k]} style={s.pickImg} />
                  {selected && (
                    <View style={s.pickCheck}>
                      <Ionicons name="checkmark-circle" size={24} color={C.accent} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  fade: { paddingHorizontal: 8, paddingBottom: 4 },
  back: { paddingHorizontal: 8, paddingVertical: 6, alignSelf: "flex-start" },
  header: { alignItems: "center", paddingHorizontal: 24, paddingTop: 6, paddingBottom: 8 },
  coverWrap: { position: "relative" },
  cover: {
    width: 200, height: 200, borderRadius: 14, backgroundColor: C.surface,
    flexDirection: "row", flexWrap: "wrap", overflow: "hidden",
  },
  coverEmpty: { alignItems: "center", justifyContent: "center" },
  cell: { width: "50%", height: "50%", backgroundColor: C.surface2 },
  editBadge: {
    position: "absolute", right: 10, bottom: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
  },
  title: {
    color: C.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.7,
    textAlign: "center", marginTop: 16,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  meta: { color: C.textDim, fontSize: 13, fontWeight: "600" },
  visPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  visPillOn: { backgroundColor: C.accent, borderColor: C.accent },
  visText: { color: C.textDim, fontSize: 12, fontWeight: "700" },
  visTextOn: { color: C.onAccent },
  controls: { flexDirection: "row", alignItems: "center", width: "100%", marginTop: 16, gap: 4 },
  playBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
  },
  disabled: { opacity: 0.35 },
  iconBtn: { padding: 10 },
  dRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 8, backgroundColor: C.bg },
  dActive: { backgroundColor: C.surface, borderRadius: 12 },
  dArt: { width: 52, height: 52, borderRadius: 11, backgroundColor: C.surface },
  dMid: { flex: 1 },
  dTitle: { color: C.text, fontSize: 15, fontWeight: "600", letterSpacing: -0.2 },
  dSub: { color: C.textDim, fontSize: 13, marginTop: 2 },
  dIcon: { padding: 6 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10,
  },
  saveText: { color: C.onAccent, fontWeight: "800", fontSize: 14 },
  muted: { color: C.textDim },
  backBtn: { backgroundColor: C.accent, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  backText: { color: C.onAccent, fontWeight: "800" },
  empty: { color: C.textFaint, textAlign: "center", marginTop: 24 },
  back2: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetTitle: { color: C.text, fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  pick: { borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  pickSelected: { borderColor: C.accent },
  pickImg: { width: 88, height: 88, borderRadius: 14, backgroundColor: C.surface2 },
  pickCheck: { position: "absolute", top: -8, right: -8, backgroundColor: "#1a1a1a", borderRadius: 12 },
});
