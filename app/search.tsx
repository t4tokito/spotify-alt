import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Song, searchSongs } from "../lib/music";
import { FoundUser, searchUsernames } from "../lib/usernames";
import { AVATARS } from "../lib/avatars";
import { SongRow } from "../components/SongRow";
import { SectionTitle } from "../components/SectionTitle";
import { useAuth } from "../lib/auth";
import { getFollowExplore } from "../lib/cloud";
import { usePlayer } from "../lib/player";
import { C, tint } from "../lib/theme";

const QUICK = ["Arijit Singh", "Diljit Dosanjh", "AP Dhillon", "Shreya Ghoshal", "Honey Singh", "Lata Mangeshkar", "KR$NA", "Taylor Swift"];

type Tab = "songs" | "people";

export default function Search() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("songs");
  const [results, setResults] = useState<Song[]>([]);
  const [people, setPeople] = useState<FoundUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [explore, setExplore] = useState<Song[]>([]);
  const { user } = useAuth();
  const { play } = usePlayer();

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setExplore([]);
        return;
      }
      let live = true;
      getFollowExplore(user.uid, 10)
        .then((ss) => live && setExplore(ss))
        .catch(() => {});
      return () => {
        live = false;
      };
    }, [user?.uid])
  );

  async function doSearch(query: string, t: Tab = tab) {
    setQ(query);
    if (!query.trim()) {
      setResults([]);
      setPeople([]);
      return;
    }
    setLoading(true);
    try {
      if (t === "songs") setResults(await searchSongs(query, 25));
      else setPeople(await searchUsernames(query, 15));
    } catch {
      if (t === "songs") setResults([]);
      else setPeople([]);
    }
    setLoading(false);
  }

  function switchTab(t: Tab) {
    setTab(t);
    if (q.trim()) doSearch(q, t);
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Text style={s.title}>Search</Text>
      <View style={s.tabs}>
        {(["songs", "people"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => switchTab(t)}
            style={({ pressed }) => [s.tab, tab === t && s.tabOn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons
              name={t === "songs" ? "musical-notes-outline" : "people-outline"}
              size={16}
              color={tab === t ? C.onAccent : C.textDim}
            />
            <Text style={[s.tabText, tab === t && s.tabTextOn]}>
              {t === "songs" ? "Songs" : "People"}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={q}
        onChangeText={(t) => doSearch(t)}
        placeholder={tab === "songs" ? "Songs, artists… (free, no ads)" : "Search username…"}
        placeholderTextColor="#777"
        style={s.input}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {tab === "songs" && !q && explore.length > 0 && (
        <View>
          <SectionTitle title="From people you follow" icon="people-outline" color={C.accent} size={17} />
          <FlatList
            horizontal
            data={explore}
            keyExtractor={(i) => "ex-" + i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => play(item, explore)} style={s.card}>
                <Image source={{ uri: item.image }} style={s.cardArt} />
                <Text numberOfLines={1} style={s.cardTitle}>{item.name}</Text>
                <Text numberOfLines={1} style={s.cardSub}>{item.artists}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
      {tab === "songs" && !q && (
        <View style={s.chips}>
          {QUICK.map((c) => (
            <Text key={c} onPress={() => doSearch(c)} style={s.chip}>{c}</Text>
          ))}
        </View>
      )}
      {loading && <ActivityIndicator color={C.accent} style={{ marginTop: 20 }} />}

      {tab === "songs" ? (
        <FlatList
          data={results}
          keyExtractor={(i) => i.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => <SongRow song={item} queue={results} index={index} />}
          ListEmptyComponent={!loading && q ? (
            <View style={s.emptyRow}>
              <Ionicons name="musical-note-outline" size={18} color="#777" />
              <Text style={s.emptyText}>No results. Try another song</Text>
            </View>
          ) : null}
        />
      ) : (
        <FlatList
          data={people}
          keyExtractor={(p) => p.uid}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/user/${encodeURIComponent(item.username)}` as any)}
              style={({ pressed }) => [s.person, pressed && { opacity: 0.6 }]}
            >
              {item.photoURL && AVATARS[item.photoURL] ? (
                <Image source={AVATARS[item.photoURL]} style={s.avatarImg} />
              ) : (
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{(item.username[0] ?? "?").toUpperCase()}</Text>
                </View>
              )}
              <Text style={s.personName}>{item.username}</Text>
              <Ionicons name="chevron-forward" size={20} color={C.neutral} />
            </Pressable>
          )}
          ListEmptyComponent={!loading && q ? (
            <Text style={s.emptySolo}>No users found.</Text>
          ) : null}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  title: { color: C.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.6, paddingHorizontal: 16, marginBottom: 10 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9,
  },
  tabOn: { backgroundColor: C.accent },
  tabText: { color: C.textDim, fontWeight: "800", fontSize: 14 },
  tabTextOn: { color: C.onAccent },
  input: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 8, padding: 12, fontSize: 16, color: "#000" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 16 },
  chip: { backgroundColor: C.surface2, color: C.text, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, overflow: "hidden" },
  card: { width: 130 },
  cardArt: { width: 130, height: 130, borderRadius: 14, backgroundColor: C.surface2 },
  cardTitle: { color: C.text, fontWeight: "700", marginTop: 6, fontSize: 13, letterSpacing: -0.2 },
  cardSub: { color: C.textDim, fontSize: 12 },
  emptyRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 30 },
  emptyText: { color: C.textFaint },
  emptySolo: { color: C.textFaint, textAlign: "center", marginTop: 30 },
  person: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: tint(C.accent, 0.2), alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.accent, fontSize: 20, fontWeight: "800" },
  avatarImg: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.surface2 },
  personName: { flex: 1, color: C.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
});
