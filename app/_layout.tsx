import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PlayerProvider } from "../lib/player";
import { BottomNav } from "../components/BottomNav";
import { MiniPlayer } from "../components/MiniPlayer";
import { usePathname } from "expo-router";

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/player";
  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <View style={{ flex: 1 }}>{children}</View>
      {!hideNav && (
        <>
          <MiniPlayer />
          <BottomNav />
        </>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#121212" }}>
      <SafeAreaProvider>
        <PlayerProvider>
          <StatusBar style="light" />
          <Shell>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#121212" } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="search" />
              <Stack.Screen name="library" />
              <Stack.Screen name="player" options={{ presentation: "modal" }} />
            </Stack>
          </Shell>
        </PlayerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
