import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlaylists } from "../lib/playlists";
import { PLAYLIST_ICON_KEYS, PLAYLIST_ICONS } from "../lib/playlistIcons";
import { C } from "../lib/theme";

export function CreatePlaylistModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { createPlaylist, setPlaylistIcon } = usePlaylists();
  const [step, setStep] = useState<"name" | "icons">("name");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string | null>(null);

  function reset() {
    setStep("name");
    setName("");
    setIcon(null);
  }

  function close() {
    reset();
    onClose();
  }

  function done() {
    if (!name.trim()) return;
    const pl = createPlaylist(name);
    if (icon) setPlaylistIcon(pl.id, icon);
    close();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={s.back} onPress={close} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={s.handle} />
        <Text style={s.title}>New playlist</Text>

        {step === "name" ? (
          <>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Give it a name…"
              placeholderTextColor="#777"
              style={s.input}
              autoFocus
              onSubmitEditing={() => name.trim() && setStep("icons")}
            />
            <Pressable
              onPress={() => name.trim() && setStep("icons")}
              style={[s.btn, !name.trim() && s.btnOff]}
            >
              <Text style={s.btnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={C.onAccent} />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => setStep("name")} style={s.editName}>
              <Text numberOfLines={1} style={s.editNameText}>{name}</Text>
              <Ionicons name="pencil-outline" size={15} color={C.neutral} />
            </Pressable>
            <Text style={s.sub}>Pick a cover</Text>
            <View style={s.grid}>
              {PLAYLIST_ICON_KEYS.map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setIcon(k)}
                  style={[s.pick, icon === k && s.pickSel]}
                >
                  <Image source={PLAYLIST_ICONS[k]} style={s.pickImg} />
                  {icon === k && (
                    <View style={s.pickCheck}>
                      <Ionicons name="checkmark-circle" size={24} color={C.accent} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
            <Pressable onPress={done} style={s.btn}>
              <Text style={s.btnText}>Create Playlist</Text>
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center" },
  title: { color: C.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
  input: { backgroundColor: C.surface2, borderRadius: 12, padding: 16, color: C.text, fontSize: 16 },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.accent, borderRadius: 24, paddingVertical: 14,
  },
  btnOff: { opacity: 0.4 },
  btnText: { color: C.onAccent, fontWeight: "800", fontSize: 15 },
  editName: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  editNameText: { color: C.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  sub: { color: C.textDim, fontSize: 13, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  pick: { borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  pickSel: { borderColor: C.accent },
  pickImg: { width: 88, height: 88, borderRadius: 14, backgroundColor: C.surface2 },
  pickCheck: { position: "absolute", top: -8, right: -8, backgroundColor: "#1a1a1a", borderRadius: 12 },
});
