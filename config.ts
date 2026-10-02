/**
 * Tokito Music backend (YouTube search + stream resolver).
 *
 * - Local dev (emulator): http://localhost:3000
 *   (Android emulator may need http://10.0.2.2:3000)
 * - Physical device (Expo Go): set EXPO_PUBLIC_YT_URL to your computer's LAN IP,
 *   e.g. EXPO_PUBLIC_YT_URL=http://192.168.1.5:3000
 * - Production: your Render URL, e.g. https://tokito-music-yt.onrender.com
 */
export const YT_URL =
  process.env.EXPO_PUBLIC_YT_URL?.replace(/\/$/, "") || "http://localhost:3000";
