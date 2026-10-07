import { useEffect, useState } from "react";
import { getProfile } from "./usernames";

/** Session cache: uid -> photoURL (null = no avatar). */
const photoCache = new Map<string, string | null>();

/**
 * Resolve someone's current avatar. The public mapping may be stale or
 * missing (old accounts), so fall back to their live profile doc once,
 * then cache for the session.
 */
export function usePeerPhoto(uid: string | undefined, mappingPhoto?: string | null): string | null {
  const [photo, setPhoto] = useState<string | null>(() => {
    if (!uid) return null;
    if (mappingPhoto) return mappingPhoto;
    return photoCache.has(uid) ? photoCache.get(uid) ?? null : null;
  });

  useEffect(() => {
    if (!uid) return;
    if (mappingPhoto) {
      photoCache.set(uid, mappingPhoto);
      setPhoto(mappingPhoto);
      return;
    }
    if (photoCache.has(uid)) {
      setPhoto(photoCache.get(uid) ?? null);
      return;
    }
    let live = true;
    getProfile(uid)
      .then((p) => {
        if (!live) return;
        const ph = p?.photoURL ?? null;
        photoCache.set(uid, ph);
        setPhoto(ph);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [uid, mappingPhoto]);

  return photo;
}
