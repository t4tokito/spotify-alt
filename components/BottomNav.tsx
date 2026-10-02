import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/search", icon: "search", label: "Search" },
  { href: "/library", icon: "library", label: "Library" },
  { href: "/profile", icon: "person", label: "Profile" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Pressable key={t.href} onPress={() => router.replace(t.href as any)} style={s.tab}>
            <Ionicons name={(active ? t.icon : `${t.icon}-outline`) as any} size={24} color={active ? "#BC8CF2" : "#888"} />
            <Text style={[s.label, active && s.active]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: "#121212", borderTopWidth: 1, borderTopColor: "#222", paddingTop: 8 },
  tab: { flex: 1, alignItems: "center", gap: 2 },
  label: { color: "#888", fontSize: 11, fontWeight: "600" },
  active: { color: "#BC8CF2" },
});
