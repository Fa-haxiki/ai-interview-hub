"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LOCAL_KEY = "ai-interview-hub:last_read";

export type ProgressRecord = {
  category: string;
  topic: string;
  slug: string;
  title: string;
  section: string;
  path: string;
  scrollRatio: number;
  updatedAt: string;
};

function readLocal(): ProgressRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as ProgressRecord) : null;
  } catch {
    return null;
  }
}

function writeLocal(record: ProgressRecord) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(record));
  } catch {
    // ignore quota errors
  }
}

async function fetchProgress(): Promise<ProgressRecord | null> {
  try {
    const res = await fetch("/api/progress", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { progress: ProgressRecord | null };
    return data.progress ?? null;
  } catch {
    return null;
  }
}

let putTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPut: ProgressRecord | null = null;

function schedulePut(record: ProgressRecord) {
  pendingPut = record;
  if (putTimer) return;
  putTimer = setTimeout(async () => {
    putTimer = null;
    const body = pendingPut;
    if (!body) return;
    try {
      await fetch("/api/progress", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // dev 环境无 Worker，静默失败
    }
  }, 5000);
}

export async function getProgress(): Promise<ProgressRecord | null> {
  const remote = await fetchProgress();
  if (remote) {
    writeLocal(remote);
    return remote;
  }
  return readLocal();
}

export function saveProgress(record: ProgressRecord) {
  writeLocal(record);
  schedulePut(record);
}

export async function flushProgress() {
  if (putTimer) {
    clearTimeout(putTimer);
    putTimer = null;
  }
  if (!pendingPut) return;
  const body = pendingPut;
  pendingPut = null;
  try {
    await fetch("/api/progress", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // ignore
  }
}

/** 首页：拉取最近一条阅读进度 */
export function useProgress() {
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProgress().then((p) => {
      if (!cancelled) {
        setProgress(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { progress, loading };
}

/** 题目页：记录滚动进度并恢复滚动 */
export function useProgressTracker(question: {
  category: string;
  topic: string;
  slug: string;
  title: string;
  section: string;
  path: string;
}) {
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restored = useRef(false);

  const computeRatio = useCallback(() => {
    if (typeof window === "undefined") return 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / max));
  }, []);

  // 恢复滚动：挂载后查一次进度，路径一致就滚回去
  useEffect(() => {
    let cancelled = false;
    getProgress().then((p) => {
      if (cancelled || !p || p.path !== question.path) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      window.scrollTo({ top: p.scrollRatio * max, behavior: "auto" });
      restored.current = true;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.path]);

  // 监听滚动：debounce 5s 写入
  useEffect(() => {
    const onScroll = () => {
      if (scrollTimer.current) return;
      scrollTimer.current = setTimeout(() => {
        scrollTimer.current = null;
        saveProgress({
          ...question,
          scrollRatio: computeRatio(),
          updatedAt: new Date().toISOString(),
        });
      }, 5000);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, [question, computeRatio]);

  // 离开页面时强制冲刷一次
  useEffect(() => {
    const onHide = () => {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
        scrollTimer.current = null;
      }
      saveProgress({
        ...question,
        scrollRatio: computeRatio(),
        updatedAt: new Date().toISOString(),
      });
      flushProgress();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });
    return () => {
      window.removeEventListener("pagehide", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, computeRatio]);
}
