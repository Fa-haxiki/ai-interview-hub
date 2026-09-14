"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  emptyCheckinStore,
  fetchRemoteCheckins,
  flushCheckins,
  incrementCheckin,
  mergeCheckinStores,
  readLocalCheckins,
  schedulePutCheckins,
  type CheckinStore,
  writeLocalCheckins,
} from "@/lib/checkin";

type CheckinContextValue = {
  ready: boolean;
  countOf: (key: string) => number;
  punch: (key: string) => void;
};

const CheckinContext = createContext<CheckinContextValue | null>(null);

export function CheckinProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<CheckinStore>(emptyCheckinStore);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const local = readLocalCheckins();
    setStore(local);
    setReady(true);

    fetchRemoteCheckins().then((remote) => {
      if (cancelled || !remote) return;
      setStore((current) => {
        const merged = mergeCheckinStores(current, remote);
        writeLocalCheckins(merged);
        if (JSON.stringify(merged.counts) !== JSON.stringify(remote.counts)) {
          schedulePutCheckins(merged);
        }
        return merged;
      });
    });

    const onHide = () => {
      void flushCheckins();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });
    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  const punch = useCallback((key: string) => {
    setStore((current) => {
      const next = incrementCheckin(current, key);
      writeLocalCheckins(next);
      schedulePutCheckins(next);
      return next;
    });
  }, []);

  const countOf = useCallback((key: string) => store.counts[key] ?? 0, [store.counts]);

  const value = useMemo(
    () => ({ ready, countOf, punch }),
    [ready, countOf, punch],
  );

  return <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>;
}

export function useCheckin() {
  const ctx = useContext(CheckinContext);
  if (!ctx) {
    throw new Error("useCheckin 需要包在 CheckinProvider 里");
  }
  return ctx;
}
