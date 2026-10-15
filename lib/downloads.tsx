import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import type { Song } from "./music";

export type DownloadedSong = { song: Song; uri: string; size: number };

type DownloadsContextType = {
  downloaded: Record<string, DownloadedSong>;
  progress: Record<string, number>; // 0..1 while downloading
  isDownloaded: (id: string) => boolean;
  isDownloading: (id: string) => boolean;
  download: (song: Song) => Promise<void>;
  remove: (id: string) => Promise<void>;
  localUri: (id: string) => string | null;
  totalBytes: number;
};

const Ctx = createContext<DownloadsContextType | null>(null);
const KEY = "@tokito-music:downloads";

function musicDir(): Directory {
  return new Directory(Paths.document, "music");
}

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
  const [downloaded, setDownloaded] = useState<Record<string, DownloadedSong>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const tasks = useRef(new Map<string, { cancel: () => void }>());
  const sizes = useRef(new Map<string, number>());

  // load + prune missing files
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return;
        const map = JSON.parse(raw) as Record<string, DownloadedSong>;
        const kept: Record<string, DownloadedSong> = {};
        for (const [id, d] of Object.entries(map)) {
          try {
            if (d?.uri && new File(d.uri).exists) kept[id] = d;
          } catch {}
        }
        setDownloaded(kept);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(downloaded)).catch(() => {});
  }, [downloaded]);

  const download = useCallback(
    async (song: Song) => {
      if (!song.url || downloaded[song.id] || tasks.current.has(song.id)) return;
      try {
        const dir = musicDir();
        try {
          dir.create();
        } catch {}
        const dest = new File(dir, `${song.id}.m4a`);
        if (dest.exists) {
          setDownloaded((m) => ({ ...m, [song.id]: { song, uri: dest.uri, size: 0 } }));
          return;
        }
        const task = File.createDownloadTask(song.url, dest, {
          onProgress: ({ bytesWritten, totalBytes }) => {
            if (totalBytes > 0) {
              sizes.current.set(song.id, totalBytes);
              setProgress((p) => ({ ...p, [song.id]: bytesWritten / totalBytes }));
            }
          },
        });
        tasks.current.set(song.id, task as unknown as { cancel: () => void });
        setProgress((p) => ({ ...p, [song.id]: 0 }));
        const file = await task.downloadAsync();
        const size = sizes.current.get(song.id) ?? 0;
        setDownloaded((m) => ({ ...m, [song.id]: { song, uri: file.uri, size } }));
      } catch {}
      tasks.current.delete(song.id);
      setProgress((p) => {
        const c = { ...p };
        delete c[song.id];
        return c;
      });
    },
    [downloaded]
  );

  const remove = useCallback(async (id: string) => {
    try {
      tasks.current.get(id)?.cancel();
    } catch {}
    tasks.current.delete(id);
    const entry = downloaded[id];
    setDownloaded((m) => {
      const c = { ...m };
      delete c[id];
      return c;
    });
    setProgress((p) => {
      const c = { ...p };
      delete c[id];
      return c;
    });
    try {
      if (entry?.uri) new File(entry.uri).delete();
    } catch {}
  }, [downloaded]);

  const localUri = useCallback(
    (id: string) => {
      const d = downloaded[id];
      if (!d) return null;
      try {
        return new File(d.uri).exists ? d.uri : null;
      } catch {
        return null;
      }
    },
    [downloaded]
  );

  const totalBytes = useMemo(
    () => Object.values(downloaded).reduce((a, d) => a + (d.size || 0), 0),
    [downloaded]
  );

  const value = useMemo<DownloadsContextType>(
    () => ({
      downloaded,
      progress,
      isDownloaded: (id) => !!downloaded[id],
      isDownloading: (id) => tasks.current.has(id) || progress[id] !== undefined,
      download,
      remove,
      localUri,
      totalBytes,
    }),
    [downloaded, progress, download, remove, localUri, totalBytes]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDownloads(): DownloadsContextType {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDownloads outside provider");
  return v;
}
