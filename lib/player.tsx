import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Song } from "./music";

type PlayerContextType = {
  current: Song | null;
  queue: Song[];
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
};

const Ctx = createContext<PlayerContextType | null>(null);

const LIKED_KEY = "@tokito-music:liked";
const HISTORY_KEY = "@tokito-music:history";

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [current, setCurrent] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [liked, setLiked] = useState<Record<string, Song>>({});
  const [history, setHistory] = useState<Song[]>([]);
  const [volume, setVolumeState] = useState(1);
  const volumeRef = useRef(1);
  const queueRef = useRef<Song[]>([]);
  const currentRef = useRef<Song | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    (async () => {
      try {
        const [l, h] = await Promise.all([
          AsyncStorage.getItem(LIKED_KEY),
          AsyncStorage.getItem(HISTORY_KEY),
        ]);
        if (l) setLiked(JSON.parse(l));
        if (h) setHistory(JSON.parse(h));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(LIKED_KEY, JSON.stringify(liked)).catch(() => {});
  }, [liked]);

  useEffect(() => {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50))).catch(() => {});
  }, [history]);

  // always push volume to the native player (never leave it quiet)
  useEffect(() => {
    try {
      player.volume = volume;
    } catch {}
  }, [player, volume]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    volumeRef.current = clamped;
    setVolumeState(clamped);
  }, []);

  const play = useCallback(
    (song: Song, q?: Song[]) => {
      const list = q ?? [song];
      queueRef.current = list;
      setQueue(list);
      currentRef.current = song;
      setCurrent(song);
      try {
        player.replace({ uri: song.url });
        player.volume = volumeRef.current;
        player.play();
      } catch {}
      setHistory((h) => [song, ...h.filter((x) => x.id !== song.id)].slice(0, 50));
    },
    [player]
  );

  const toggle = useCallback(() => {
    try {
      if (statusRef.current.playing) player.pause();
      else player.play();
    } catch {}
  }, [player]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const q = queueRef.current;
      const cur = currentRef.current;
      if (!cur || q.length === 0) return;
      const i = q.findIndex((s) => s.id === cur.id);
      const nxt = q[(i + dir + q.length) % q.length];
      if (!nxt) return;
      queueRef.current = q;
      setQueue(q);
      currentRef.current = nxt;
      setCurrent(nxt);
      try {
        player.replace({ uri: nxt.url });
        player.volume = volumeRef.current;
        player.play();
      } catch {}
      setHistory((h) => [nxt, ...h.filter((x) => x.id !== nxt.id)].slice(0, 50));
    },
    [player]
  );

  const stepRef = useRef(step);
  stepRef.current = step;

  // auto-next when song ends
  useEffect(() => {
    if (status.didJustFinish) {
      stepRef.current?.(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

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
    setLiked((m) => {
      const c = { ...m };
      if (c[s.id]) delete c[s.id];
      else c[s.id] = s;
      return c;
    });
  }, []);

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
    }),
    [current, queue, status, liked, history, play, toggle, next, prev, seek, volume, setVolume, toggleLike, isLiked]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer(): PlayerContextType {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer outside provider");
  return v;
}
