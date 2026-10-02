/**
 * Tokito Music backend (YouTube search + stream resolver).
 *
 * Default: production server on Render.
 * Local dev: EXPO_PUBLIC_YT_URL=http://<laptop-LAN-IP>:3000 npx expo start
 *   (physical device needs your LAN IP, e.g. http://192.168.1.5:3000 —
 *   localhost only works on emulators; Android emulator may need
 *   http://10.0.2.2:3000). Run the server with: cd server && npm start
 */
export const YT_URL =
  process.env.EXPO_PUBLIC_YT_URL?.replace(/\/$/, "") ||
  "https://tokito-music-yt.onrender.com";
