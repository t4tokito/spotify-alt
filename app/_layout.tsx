import { useEffect } from "react";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import * as Updates from "expo-updates";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth";
import { PlayerProvider } from "../lib/player";
import { PlaylistProvider } from "../lib/playlists";
import { BottomNav } from "../components/BottomNav";
import { MiniPlayer } from "../components/MiniPlayer";

const AUTH_SCREENS = ["welcome", "login", "signup", "forgot-password"];

function Shell({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const onAuthScreen = AUTH_SCREENS.includes(segments[0] as string);
    if (!user && !onAuthScreen) {
      router.replace("/welcome");
    } else if (user && onAuthScreen) {
      router.replace("/");
    }
  }, [user, initializing, segments, router]);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#121212" }}>
        <ActivityIndicator color="#BC8CF2" size="large" />
      </View>
    );
  }

  const hideChrome = pathname === "/player" || AUTH_SCREENS.includes(segments[0] as string);

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <View style={{ flex: 1 }}>{children}</View>
      {!hideChrome && (
        <>
          <MiniPlayer />
          <BottomNav />
        </>
      )}
    </View>
  );
}

export default function RootLayout() {
  // OTA updates: silently apply any published update on launch (release builds only)
  useEffect(() => {
    (async () => {
      try {
        if (__DEV__ || !Updates.isEnabled) return;
        const check = await Updates.checkForUpdateAsync();
        if (check.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {}
    })();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#121212" }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PlayerProvider>
          <PlaylistProvider>
            <StatusBar style="light" />
            <Shell>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#121212" } }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="search" />
                <Stack.Screen name="library" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="welcome" />
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="forgot-password" />
                <Stack.Screen name="player" options={{ presentation: "modal" }} />
                <Stack.Screen name="playlist/[id]" />
                <Stack.Screen name="playlists" />
                <Stack.Screen name="liked" />
                <Stack.Screen name="stats" />
                <Stack.Screen name="user/[username]" />
              </Stack>
            </Shell>
          </PlaylistProvider>
          </PlayerProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
