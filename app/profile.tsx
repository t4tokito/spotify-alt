import { useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { authErrorMessage, useAuth } from "../lib/auth";
import { usePlayer } from "../lib/player";
import { AVATARS, AVATAR_KEYS } from "../lib/avatars";
import { C } from "../lib/theme";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { profile, user, signOut, updateUsername, updatePhoto } = useAuth();
  const { liked, history } = usePlayer();
  const likedCount = Object.keys(liked).length;
  const name = profile?.username ?? "Music Lover";
  const initial = (name.trim()[0] ?? "M").toUpperCase();
  const avatarSrc = profile?.photoURL ? AVATARS[profile.photoURL] : null;

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveName() {
    setNameError("");
    if (!newName.trim()) return setNameError("Enter a username.");
    setBusy(true);
    try {
      await updateUsername(newName);
      setEditing(false);
      setNewName("");
    } catch (e) {
      setNameError(authErrorMessage(e));
    }
    setBusy(false);
  }

  async function pickAvatar(key: string) {
    try {
      await updatePhoto(key);
    } catch {}
    setAvatarOpen(false);
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Text style={s.title}>Profile</Text>
      <View style={s.card}>
        <Pressable onPress={() => setAvatarOpen(true)} style={s.avatarWrap}>
          {avatarSrc ? (
            <Image source={avatarSrc} style={s.avatarImg} />
          ) : (
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
          )}
          <View style={s.camBadge}>
            <Ionicons name="camera" size={14} color={C.onAccent} />
          </View>
        </Pressable>

        {editing ? (
          <View style={s.editRow}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder={name}
              placeholderTextColor="#777"
              style={s.nameInput}
              autoCapitalize="none"
              autoFocus
            />
            <Pressable onPress={saveName} disabled={busy} style={s.saveBtn}>
              {busy ? (
                <ActivityIndicator color={C.onAccent} size="small" />
              ) : (
                <Ionicons name="checkmark" size={20} color={C.onAccent} />
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                setEditing(false);
                setNewName("");
                setNameError("");
              }}
              style={s.cancelBtn}
            >
              <Ionicons name="close" size={20} color={C.textDim} />
            </Pressable>
          </View>
        ) : (
          <View style={s.nameRow}>
            <Text style={s.name}>{name}</Text>
            <Pressable
              onPress={() => {
                setNewName(name === "Music Lover" ? "" : name);
                setEditing(true);
              }}
              hitSlop={8}
            >
              <Ionicons name="pencil-outline" size={17} color={C.neutral} />
            </Pressable>
          </View>
        )}
        {!!nameError && <Text style={s.error}>{nameError}</Text>}
        <Text style={s.email}>{profile?.email ?? user?.email ?? ""}</Text>
      </View>

      <View style={s.stats}>
        <View style={s.stat}>
          <Ionicons name="heart" size={20} color={C.like} />
          <Text style={s.statNum}>{likedCount}</Text>
          <Text style={s.statLabel}>Liked</Text>
        </View>
        <View style={s.stat}>
          <Ionicons name="time-outline" size={20} color={C.neutral} />
          <Text style={s.statNum}>{history.length}</Text>
          <Text style={s.statLabel}>Played</Text>
        </View>
      </View>
      <Pressable onPress={signOut} style={({ pressed }) => [s.outBtn, pressed && { opacity: 0.75 }]}>
        <Ionicons name="log-out-outline" size={20} color={C.onAccent} />
        <Text style={s.outText}>Log Out</Text>
      </Pressable>

      <Modal visible={avatarOpen} transparent animationType="fade" onRequestClose={() => setAvatarOpen(false)}>
        <Pressable style={s.back} onPress={() => setAvatarOpen(false)} />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <Text style={s.sheetTitle}>Choose a picture</Text>
          <View style={s.grid}>
            {AVATAR_KEYS.map((k) => {
              const selected = profile?.photoURL === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => pickAvatar(k)}
                  style={[s.pick, selected && s.pickSelected]}
                >
                  <Image source={AVATARS[k]} style={s.pickImg} />
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
  root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16 },
  title: { color: C.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.6, marginBottom: 16 },
  card: { backgroundColor: C.surface, borderRadius: 18, padding: 24, alignItems: "center" },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
  },
  avatarImg: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.surface2 },
  avatarText: { color: C.onAccent, fontSize: 34, fontWeight: "900" },
  camBadge: {
    position: "absolute", right: 0, bottom: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.surface,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  name: { color: C.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, width: "100%" },
  nameInput: {
    flex: 1, backgroundColor: C.surface2, borderRadius: 10,
    padding: 11, color: C.text, fontSize: 16,
  },
  saveBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
  },
  cancelBtn: { padding: 8 },
  error: { color: C.danger, fontSize: 13, marginTop: 8 },
  email: { color: C.textDim, marginTop: 6 },
  stats: { flexDirection: "row", gap: 12, marginTop: 12 },
  stat: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 16, alignItems: "center", gap: 4 },
  statNum: { color: C.text, fontSize: 20, fontWeight: "800" },
  statLabel: { color: C.textDim, fontSize: 12 },
  outBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.accent, borderRadius: 24, paddingVertical: 14, marginTop: 20,
  },
  outText: { color: C.onAccent, fontWeight: "800", fontSize: 16 },
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetTitle: { color: C.text, fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  pick: { borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  pickSelected: { borderColor: C.accent },
  pickImg: { width: 88, height: 88, borderRadius: 14, backgroundColor: C.surface2 },
  pickCheck: { position: "absolute", top: -8, right: -8, backgroundColor: "#1a1a1a", borderRadius: 12 },
});
