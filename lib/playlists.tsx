import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Song } from "./music";

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

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setPlaylists(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(playlists)).catch(() => {});
  }, [playlists]);

  const createPlaylist = useCallback((name: string): Playlist => {
    const pl: Playlist = { id: newId(), name: name.trim().slice(0, 40) || "My Playlist", createdAt: Date.now(), songs: [] };
    setPlaylists((p) => [pl, ...p]);
    return pl;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((p) => p.filter((x) => x.id !== id));
  }, []);

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
