import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Song } from "./music";
import { useAuth } from "./auth";
import { deleteCloudPlaylist, loadCloudPlaylists, saveCloudPlaylist } from "./cloud";

export type Playlist = {
  id: string;
  name: string;
  createdAt: number;
  songs: Song[];
};

type PlaylistContextType = {
  playlists: Playlist[];
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  isInPlaylist: (playlistId: string, songId: string) => boolean;
};

const Ctx = createContext<PlaylistContextType | null>(null);
const KEY = "@tokito-music:playlists";

function newId(): string {
  return `pl_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function mergeSongs(a: Song[], b: Song[]): Song[] {
  const seen = new Set(a.map((s) => s.id));
  return [...a, ...b.filter((s) => !seen.has(s.id))];
}

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const cloudReady = useRef(false);
  const wasLoggedIn = useRef(false);
  const playlistsRef = useRef(playlists);
  playlistsRef.current = playlists;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setPlaylists(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  // login -> merge cloud in; logout -> wipe (data lives in the account now)
  useEffect(() => {
    if (!uid) {
      cloudReady.current = false;
      if (wasLoggedIn.current) {
        wasLoggedIn.current = false;
        setPlaylists([]);
        AsyncStorage.removeItem(KEY).catch(() => {});
      }
      return;
    }
    wasLoggedIn.current = true;
    let cancelled = false;
    (async () => {
      try {
        const cloud = await loadCloudPlaylists(uid);
        if (cancelled) return;
        // pull: merge cloud into local
        const map = new Map(playlistsRef.current.map((p) => [p.id, p] as const));
        for (const cp of cloud) {
          const ex = map.get(cp.id);
          map.set(cp.id, ex ? { ...ex, songs: mergeSongs(ex.songs, cp.songs) } : cp);
        }
        const merged = [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
        setPlaylists(merged);
        // push: upload everything so other devices converge
        await Promise.all(merged.map((p) => saveCloudPlaylist(uid, p))).catch(() => {});
      } catch (e) {
        console.warn("cloud sync (playlists) failed:", e);
      }
      if (!cancelled) cloudReady.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(playlists)).catch(() => {});
    if (!uid || !cloudReady.current) return;
    const t = setTimeout(() => {
      Promise.all(playlists.map((p) => saveCloudPlaylist(uid, p))).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [playlists, uid]);

  const createPlaylist = useCallback((name: string): Playlist => {
    const pl: Playlist = { id: newId(), name: name.trim().slice(0, 40) || "My Playlist", createdAt: Date.now(), songs: [] };
    setPlaylists((p) => [pl, ...p]);
    return pl;
  }, []);

  const deletePlaylist = useCallback(
    (id: string) => {
      setPlaylists((p) => p.filter((x) => x.id !== id));
      if (uid) deleteCloudPlaylist(uid, id).catch(() => {});
    },
    [uid]
  );

  const renamePlaylist = useCallback((id: string, name: string) => {
    const n = name.trim().slice(0, 40);
    if (!n) return;
    setPlaylists((p) => p.map((x) => (x.id === id ? { ...x, name: n } : x)));
  }, []);

  const addToPlaylist = useCallback((playlistId: string, song: Song) => {
    setPlaylists((p) =>
      p.map((x) =>
        x.id === playlistId && !x.songs.some((s) => s.id === song.id)
          ? { ...x, songs: [...x.songs, song] }
          : x
      )
    );
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists((p) =>
      p.map((x) => (x.id === playlistId ? { ...x, songs: x.songs.filter((s) => s.id !== songId) } : x))
    );
  }, []);

  const isInPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      const pl = playlists.find((x) => x.id === playlistId);
      return !!pl?.songs.some((s) => s.id === songId);
    },
    [playlists]
  );

  const value = useMemo(
    () => ({ playlists, createPlaylist, deletePlaylist, renamePlaylist, addToPlaylist, removeFromPlaylist, isInPlaylist }),
    [playlists, createPlaylist, deletePlaylist, renamePlaylist, addToPlaylist, removeFromPlaylist, isInPlaylist]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlaylists(): PlaylistContextType {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlaylists outside provider");
  return v;
}
