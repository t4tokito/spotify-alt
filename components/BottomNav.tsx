import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../lib/theme";

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
    <View style={s.wrap}>
      <BlurView intensity={80} tint="dark" style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Pressable
              key={t.href}
              onPress={() => router.replace(t.href as any)}
              style={({ pressed }) => [s.tab, pressed && { opacity: 0.55 }]}
            >
              <Ionicons
                name={(active ? t.icon : `${t.icon}-outline`) as any}
                size={24}
                color={active ? C.accent : C.neutral}
              />
              <Text style={[s.label, active && s.active]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(18,18,18,0.7)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  bar: { flexDirection: "row", paddingTop: 10 },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  label: { color: C.neutral, fontSize: 11, fontWeight: "600" },
  active: { color: C.accent },
});
