export const CHECKIN_STORAGE_KEY = "ai-interview-hub:checkins";

export type CheckinStore = {
  counts: Record<string, number>;
  updatedAt: string;
};

export function articleCheckinKey(url: string) {
  return url;
}

export function packItemCheckinKey(packUrl: string, index: number) {
  return `${packUrl}#q-${index + 1}`;
}

export function emptyCheckinStore(): CheckinStore {
  return { counts: {}, updatedAt: new Date().toISOString() };
}

export function readLocalCheckins(): CheckinStore {
  if (typeof window === "undefined") return emptyCheckinStore();
  try {
    const raw = window.localStorage.getItem(CHECKIN_STORAGE_KEY);
    if (!raw) return emptyCheckinStore();
    return normalizeStore(JSON.parse(raw));
  } catch {
    return emptyCheckinStore();
  }
}

export function writeLocalCheckins(store: CheckinStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota
  }
}

export function mergeCheckinStores(a: CheckinStore, b: CheckinStore): CheckinStore {
  const counts: Record<string, number> = { ...a.counts };
  for (const [key, value] of Object.entries(b.counts)) {
    counts[key] = Math.max(counts[key] ?? 0, value);
  }
  const updatedAt = a.updatedAt > b.updatedAt ? a.updatedAt : b.updatedAt;
  return { counts, updatedAt };
}

export function incrementCheckin(store: CheckinStore, key: string): CheckinStore {
  const next = (store.counts[key] ?? 0) + 1;
  return {
    counts: { ...store.counts, [key]: next },
    updatedAt: new Date().toISOString(),
  };
}

function normalizeStore(value: unknown): CheckinStore {
  if (!value || typeof value !== "object") return emptyCheckinStore();
  const raw = value as { counts?: unknown; updatedAt?: unknown };
  const counts: Record<string, number> = {};
  if (raw.counts && typeof raw.counts === "object") {
    for (const [key, count] of Object.entries(raw.counts as Record<string, unknown>)) {
      if (!key.startsWith("/")) continue;
      const n = Number(count);
      if (Number.isInteger(n) && n > 0) counts[key] = n;
    }
  }
  return {
    counts,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

export async function fetchRemoteCheckins(): Promise<CheckinStore | null> {
  try {
    const res = await fetch("/api/checkin", { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { checkins?: unknown };
    if (!data.checkins) return null;
    return normalizeStore(data.checkins);
  } catch {
    return null;
  }
}

let putTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPut: CheckinStore | null = null;

export function schedulePutCheckins(store: CheckinStore) {
  pendingPut = store;
  if (putTimer) return;
  putTimer = setTimeout(() => {
    putTimer = null;
    void flushCheckins();
  }, 800);
}

export async function flushCheckins() {
  if (putTimer) {
    clearTimeout(putTimer);
    putTimer = null;
  }
  const body = pendingPut;
  if (!body) return;
  pendingPut = null;
  try {
    await fetch("/api/checkin", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // 本地预览没有 Worker 时静默失败
  }
}
