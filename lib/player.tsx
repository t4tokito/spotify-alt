import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, requestNotificationPermissionsAsync } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Song } from "./music";
import { getSuggestions } from "./music";
import { useAuth } from "./auth";
import { likeCloud, loadCloudHistory, loadCloudLiked, loadCloudStats, saveCloudHistory, saveCloudStats, unlikeCloud, bumpGlobalPlay } from "./cloud";

export type RepeatMode = "off" | "all" | "one";

export type PlayStat = { n: number; last: number; song: Song };

type PlayerContextType = {
  current: Song | null;
  queue: Song[];
  order: Song[];
  isPlaying: boolean;
  position: number;
  duration: number;
  loading: boolean;
  liked: Record<string, Song>;
  history: Song[];
  toggleLike: (s: Song) => void;
  isLiked: (id: string) => boolean;
  play: (song: Song, queue?: Song[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  volume: number;
  setVolume: (v: number) => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  repeat: RepeatMode;
  cycleRepeat: () => void;
  jumpTo: (song: Song) => void;
  removeFromQueue: (id: string) => void;
  sleepLeft: number | null;
  setSleepTimer: (mins: number | "track" | null) => void;
  startRadio: (song: Song) => void;
  stats: Record<string, PlayStat>;
};

const Ctx = createContext<PlayerContextType | null>(null);

const LIKED_KEY = "@tokito-music:liked";
const HISTORY_KEY = "@tokito-music:history";
const STATS_KEY = "@tokito-music:stats";

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [current, setCurrent] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [liked, setLiked] = useState<Record<string, Song>>({});
  const [history, setHistory] = useState<Song[]>([]);
  const [stats, setStats] = useState<Record<string, PlayStat>>({});
  const [volume, setVolumeState] = useState(1);
  const volumeRef = useRef(1);
  const [order, setOrder] = useState<Song[]>([]);
  const orderRef = useRef<Song[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const shuffleRef = useRef(false);
  const [repeat, setRepeat] = useState<RepeatMode>("all");
  const repeatRef = useRef<RepeatMode>("all");
  const [sleepLeft, setSleepLeft] = useState<number | null>(null);
  const sleepRef = useRef<{ mode: "timed" | "track"; at: number } | null>(null);
  const queueRef = useRef<Song[]>([]);
  const currentRef = useRef<Song | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const cloudReady = useRef(false);
  const wasLoggedIn = useRef(false);
  const uidRef = useRef<string | null>(null);
  uidRef.current = uid;
  const likedRef = useRef(liked);
  likedRef.current = liked;
  const historyRef = useRef(history);
  historyRef.current = history;
  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    (async () => {
      try {
        const [l, h, st] = await Promise.all([
          AsyncStorage.getItem(LIKED_KEY),
          AsyncStorage.getItem(HISTORY_KEY),
          AsyncStorage.getItem(STATS_KEY),
        ]);
        if (l) setLiked(JSON.parse(l));
        if (h) setHistory(JSON.parse(h));
        if (st) setStats(JSON.parse(st));
      } catch {}
    })();
  }, []);

  // login -> merge cloud data in; logout -> wipe (data lives in the account now)
  useEffect(() => {
    if (!uid) {
      cloudReady.current = false;
      if (wasLoggedIn.current) {
        wasLoggedIn.current = false;
        setLiked({});
        setHistory([]);
        setStats({});
        AsyncStorage.multiRemove([LIKED_KEY, HISTORY_KEY, STATS_KEY]).catch(() => {});
      }
      return;
    }
    wasLoggedIn.current = true;
    let cancelled = false;
    (async () => {
      try {
        const [cLiked, cHist, cStats] = await Promise.all([
          loadCloudLiked(uid),
          loadCloudHistory(uid),
          loadCloudStats(uid),
        ]);
        if (cancelled) return;
        // pull: merge cloud into local
        const localLiked = { ...likedRef.current };
        const localHist = [...historyRef.current];
        const mergedLiked = { ...cLiked, ...localLiked };
        const seen = new Set(localHist.map((s) => s.id));
        const mergedHist = [...localHist, ...cHist.filter((s) => !seen.has(s.id))].slice(0, 50);
        const mergedStats: Record<string, PlayStat> = { ...cStats };
        for (const [id, st] of Object.entries(statsRef.current)) {
          const c = mergedStats[id];
          mergedStats[id] =
            c && c.n >= st.n ? c : { n: Math.max(c?.n ?? 0, st.n), last: Math.max(c?.last ?? 0, st.last), song: st.song };
        }
        setLiked(mergedLiked);
        setHistory(mergedHist);
        setStats(mergedStats);
        // push: upload local-only data so other devices see it
        const freshLikes = Object.values(localLiked).filter((s) => !cLiked[s.id]);
        await Promise.all([
          ...freshLikes.map((s) => likeCloud(uid, s)),
          saveCloudHistory(uid, mergedHist),
          saveCloudStats(uid, mergedStats),
        ]).catch(() => {});
      } catch (e) {
        console.warn("cloud sync (liked/history) failed:", e);
      }
      if (!cancelled) cloudReady.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    AsyncStorage.setItem(LIKED_KEY, JSON.stringify(liked)).catch(() => {});
  }, [liked]);

  useEffect(() => {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50))).catch(() => {});
    if (!uid || !cloudReady.current) return;
    const t = setTimeout(() => {
      saveCloudHistory(uid, history.slice(0, 50)).catch(() => {});
    }, 4000);
    return () => clearTimeout(t);
  }, [history, uid]);

  useEffect(() => {
    AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats)).catch(() => {});
    if (!uid || !cloudReady.current) return;
    const t = setTimeout(() => {
      saveCloudStats(uid, stats).catch(() => {});
    }, 5000);
    return () => clearTimeout(t);
  }, [stats, uid]);

  const recordPlay = useCallback((song: Song) => {
    setStats((prev) => ({
      ...prev,
      [song.id]: { n: (prev[song.id]?.n ?? 0) + 1, last: Date.now(), song },
    }));
    if (uidRef.current) bumpGlobalPlay(song).catch(() => {});
  }, []);

  // audio session: background playback + lock screen association
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "doNotMix",
        });
      } catch {}
      try {
        if (Platform.OS === "android") await requestNotificationPermissionsAsync();
      } catch {}
    })();
  }, []);

  // always push volume to the native player (never leave it quiet)
  useEffect(() => {
    try {
      player.volume = volume;
    } catch {}
  }, [player, volume]);

  // notification shade / lock screen: song name, artist, artwork + controls
  const syncLockScreen = useCallback(
    (song: Song | null) => {
      try {
        if (!song) {
          player.clearLockScreenControls();
          return;
        }
        player.setActiveForLockScreen(true, {
          title: song.name,
          artist: song.artists || "Tokito Music",
          albumTitle: song.albumName || "Tokito Music",
          artworkUrl: song.image || undefined,
        });
      } catch {}
    },
    [player]
  );

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    volumeRef.current = clamped;
    setVolumeState(clamped);
  }, []);

  function shuffledRest(list: Song[], currentId?: string): Song[] {
    const rest = list.filter((s) => s.id !== currentId);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return rest;
  }

  const play = useCallback(
    (song: Song, q?: Song[]) => {
      const list = q ?? [song];
      queueRef.current = list;
      setQueue(list);
      const ord = shuffleRef.current ? [song, ...shuffledRest(list, song.id)] : list;
      orderRef.current = ord;
      setOrder(ord);
      currentRef.current = song;
      setCurrent(song);
      syncLockScreen(song);
      try {
        player.replace({ uri: song.url });
        player.volume = volumeRef.current;
        player.play();
      } catch {}
      setHistory((h) => [song, ...h.filter((x) => x.id !== song.id)].slice(0, 50));
      recordPlay(song);
    },
    [player, recordPlay, syncLockScreen]
  );

  const toggle = useCallback(() => {
    try {
      if (statusRef.current.playing) player.pause();
      else player.play();
    } catch {}
  }, [player]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const q = orderRef.current;
      const cur = currentRef.current;
      if (!cur || q.length === 0) return;
      const i = q.findIndex((s) => s.id === cur.id);
      if (dir === 1 && i === q.length - 1 && repeatRef.current === "off") {
        try {
          player.pause();
        } catch {}
        return;
      }
      const nxt = q[(i + dir + q.length) % q.length];
      if (!nxt) return;
      currentRef.current = nxt;
      setCurrent(nxt);
      syncLockScreen(nxt);
      try {
        player.replace({ uri: nxt.url });
        player.volume = volumeRef.current;
        player.play();
      } catch {}
      setHistory((h) => [nxt, ...h.filter((x) => x.id !== nxt.id)].slice(0, 50));
      recordPlay(nxt);
    },
    [player, recordPlay, syncLockScreen]
  );

  const stepRef = useRef(step);
  stepRef.current = step;

  // auto-advance when song ends (repeat-one replays instead)
  useEffect(() => {
    if (status.didJustFinish) {
      if (repeatRef.current === "one") {
        try {
          player.seekTo(0);
          player.play();
        } catch {}
      } else {
        stepRef.current?.(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  const toggleShuffle = useCallback(() => {
    const on = !shuffleRef.current;
    shuffleRef.current = on;
    setShuffle(on);
    const cur = currentRef.current;
    const base = queueRef.current;
    const ord = on && cur ? [cur, ...shuffledRest(base, cur.id)] : [...base];
    orderRef.current = ord;
    setOrder(ord);
  }, []);

  const cycleRepeat = useCallback(() => {
    const nextMode: RepeatMode =
      repeatRef.current === "off" ? "all" : repeatRef.current === "all" ? "one" : "off";
    repeatRef.current = nextMode;
    setRepeat(nextMode);
  }, []);

  const jumpTo = useCallback(
    (song: Song) => {
      currentRef.current = song;
      setCurrent(song);
      syncLockScreen(song);
      try {
        player.replace({ uri: song.url });
        player.volume = volumeRef.current;
        player.play();
      } catch {}
      setHistory((h) => [song, ...h.filter((x) => x.id !== song.id)].slice(0, 50));
      recordPlay(song);
    },
    [player, recordPlay, syncLockScreen]
  );

  const removeFromQueue = useCallback((id: string) => {
    if (currentRef.current?.id === id) return;
    queueRef.current = queueRef.current.filter((s) => s.id !== id);
    setQueue([...queueRef.current]);
    orderRef.current = orderRef.current.filter((s) => s.id !== id);
    setOrder([...orderRef.current]);
  }, []);

  const clearSleep = useCallback(() => {
    sleepRef.current = null;
    setSleepLeft(null);
  }, []);

  const setSleepTimer = useCallback(
    (mins: number | "track" | null) => {
      if (mins === null) {
        clearSleep();
        return;
      }
      if (mins === "track") {
        sleepRef.current = { mode: "track", at: 0 };
      } else {
        sleepRef.current = { mode: "timed", at: Date.now() + mins * 60000 };
        setSleepLeft(mins * 60);
      }
    },
    [clearSleep]
  );

  // sleep timer watchdog
  useEffect(() => {
    const t = setInterval(() => {
      const s = sleepRef.current;
      if (!s) return;
      if (s.mode === "track") {
        const st = statusRef.current;
        const dur = st.duration ?? 0;
        const remaining = dur - (st.currentTime ?? 0);
        setSleepLeft(dur > 0 ? Math.max(0, Math.round(remaining)) : null);
        if (dur > 0 && remaining <= 3) {
          clearSleep();
          try {
            player.pause();
          } catch {}
        }
      } else {
        const left = Math.max(0, Math.round((s.at - Date.now()) / 1000));
        setSleepLeft(left);
        if (left <= 0) {
          clearSleep();
          try {
            player.pause();
          } catch {}
        }
      }
    }, 5000);
    return () => clearInterval(t);
  }, [player, clearSleep]);

  const startRadio = useCallback(async (song: Song) => {
    try {
      const sug = await getSuggestions(song.id, 20);
      const fresh = sug.filter((s) => s.id !== song.id);
      if (fresh.length === 0) return;
      // queue similar songs right after this one — never interrupt playback
      const mergeAfter = (list: Song[]) => {
        const i = list.findIndex((s) => s.id === song.id);
        const newOnes = fresh.filter((f) => !list.some((o) => o.id === f.id));
        if (i === -1) return [...list, ...newOnes];
        return [...list.slice(0, i + 1), ...newOnes, ...list.slice(i + 1)];
      };
      queueRef.current = mergeAfter(queueRef.current);
      setQueue([...queueRef.current]);
      orderRef.current = mergeAfter(orderRef.current);
      setOrder([...orderRef.current]);
    } catch {}
  }, []);

  const next = useCallback(() => {
    stepRef.current?.(1);
  }, []);

  const prev = useCallback(() => {
    try {
      if ((statusRef.current.currentTime ?? 0) > 5) {
        player.seekTo(0);
        return;
      }
    } catch {}
    stepRef.current?.(-1);
  }, [player]);

  const seek = useCallback(
    (sec: number) => {
      try {
        player.seekTo(sec);
      } catch {}
    },
    [player]
  );

  const toggleLike = useCallback((s: Song) => {
    const liking = !liked[s.id];
    setLiked((m) => {
      const c = { ...m };
      if (c[s.id]) delete c[s.id];
      else c[s.id] = s;
      return c;
    });
    if (uid) {
      (liking ? likeCloud(uid, s) : unlikeCloud(uid, s.id)).catch(() => {});
    }
  }, [liked, uid]);

  const isLiked = useCallback((id: string) => !!liked[id], [liked]);

  const value = useMemo<PlayerContextType>(
    () => ({
      current,
      queue,
      isPlaying: !!status.playing,
      position: status.currentTime ?? 0,
      duration: status.duration ?? current?.duration ?? 0,
      loading: !status.isLoaded,
      liked,
      history,
      toggleLike,
      isLiked,
      play,
      toggle,
      next,
      prev,
      seek,
      volume,
      setVolume,
      order,
      shuffle,
      toggleShuffle,
      repeat,
      cycleRepeat,
      jumpTo,
      removeFromQueue,
      sleepLeft,
      setSleepTimer,
      startRadio,
      stats,
    }),
    [current, queue, order, status, liked, history, play, toggle, next, prev, seek, volume, setVolume, shuffle, toggleShuffle, repeat, cycleRepeat, jumpTo, removeFromQueue, sleepLeft, setSleepTimer, startRadio, stats, toggleLike, isLiked]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer(): PlayerContextType {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer outside provider");
  return v;
}
