import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Song } from "./saavn";
import { resolveYouTubeStream } from "./youtube";

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
  play: (song: Song, queue?: Song[]) => Promise<void>;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
};

const Ctx = createContext<PlayerContextType | null>(null);

const LIKED_KEY = "@tokito-music:liked";
const HISTORY_KEY = "@tokito-music:history";

/** YouTube stream URLs expire — never trust a stored one, always re-resolve. */
function stripStaleUrl(s: Song): Song {
  if (s.source === "youtube") return { ...s, url: "" };
  return s;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [current, setCurrent] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [liked, setLiked] = useState<Record<string, Song>>({});
  const [history, setHistory] = useState<Song[]>([]);
  const [resolving, setResolving] = useState(false);
  const queueRef = useRef<Song[]>([]);
  const currentRef = useRef<Song | null>(null);
  const urlCache = useRef<Map<string, string>>(new Map());
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    (async () => {
      try {
        const [l, h] = await Promise.all([
          AsyncStorage.getItem(LIKED_KEY),
          AsyncStorage.getItem(HISTORY_KEY),
        ]);
        if (l) {
          const parsed = JSON.parse(l) as Record<string, Song>;
          for (const k of Object.keys(parsed)) parsed[k] = stripStaleUrl(parsed[k]);
          setLiked(parsed);
        }
        if (h) setHistory((JSON.parse(h) as Song[]).map(stripStaleUrl));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(LIKED_KEY, JSON.stringify(liked)).catch(() => {});
  }, [liked]);

  useEffect(() => {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50))).catch(() => {});
  }, [history]);

  const withUrl = useCallback(async (song: Song): Promise<Song> => {
    if (song.source === "youtube" && song.videoId) {
      const cached = urlCache.current.get(song.videoId);
      if (cached) return { ...song, url: cached };
      const url = await resolveYouTubeStream(song.videoId);
      urlCache.current.set(song.videoId, url);
      return { ...song, url };
    }
    return song;
  }, []);

  const play = useCallback(
    async (song: Song, q?: Song[]) => {
      const list = q ?? [song];
      queueRef.current = list;
      setQueue(list);
      currentRef.current = song;
      setCurrent(song);
      setResolving(true);
      try {
        const full = await withUrl(song);
        queueRef.current = queueRef.current.map((s) => (s.id === full.id ? full : s));
        setQueue([...queueRef.current]);
        currentRef.current = full;
        setCurrent(full);
        player.replace({ uri: full.url });
        player.play();
        setHistory((h) => [full, ...h.filter((x) => x.id !== full.id)].slice(0, 50));
      } catch {
        // stream resolve failed — thumbnail/title stay visible, user can retry
      } finally {
        setResolving(false);
      }
    },
    [player, withUrl]
  );

  const toggle = useCallback(() => {
    try {
      if (statusRef.current.playing) player.pause();
      else player.play();
    } catch {}
  }, [player]);

  const step = useCallback(
    async (dir: 1 | -1) => {
      const q = queueRef.current;
      const cur = currentRef.current;
      if (!cur || q.length === 0) return;
      const i = q.findIndex((s) => s.id === cur.id);
      const nxt = q[(i + dir + q.length) % q.length];
      if (nxt) await play(nxt, q);
    },
    [play]
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
      loading: !status.isLoaded || resolving,
      liked,
      history,
      toggleLike,
      isLiked,
      play,
      toggle,
      next,
      prev,
      seek,
    }),
    [current, queue, status, resolving, liked, history, play, toggle, next, prev, seek, toggleLike, isLiked]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer(): PlayerContextType {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer outside provider");
  return v;
}
