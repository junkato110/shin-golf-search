"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "shin-golf-search:favorites";
const VERSION = 1;

type Stored = { version: number; ids: string[] };

// モジュールレベルのキャッシュ。useSyncExternalStore の getSnapshot は
// 同じデータに対して同一参照を返す必要があるため、文字列ベースで判定する。
let cachedRaw: string | null = null;
let cachedIds: string[] = [];

function readSnapshot(): string[] {
  if (typeof window === "undefined") return cachedIds;
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  try {
    if (raw) {
      const parsed: Stored = JSON.parse(raw);
      if (parsed?.version === VERSION && Array.isArray(parsed.ids)) {
        cachedIds = parsed.ids.filter((x) => typeof x === "string");
        return cachedIds;
      }
    }
  } catch {
    /* ignore */
  }
  cachedIds = [];
  return cachedIds;
}

function getServerSnapshot(): string[] {
  return [];
}

const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedRaw = null; // 無効化して再読み込みを促す
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", handler);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handler);
  };
}

function writeStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: VERSION, ids } satisfies Stored)
  );
  cachedRaw = null;
  listeners.forEach((l) => l());
}

/**
 * お気に入りコースID を localStorage で管理する。
 * useSyncExternalStore でハイドレーション安全に同期。
 */
export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);

  const isFavorite = useCallback(
    (id: string) => ids.includes(id),
    [ids]
  );

  const toggle = useCallback((id: string) => {
    const current = readSnapshot();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    writeStorage(next);
  }, []);

  const remove = useCallback((id: string) => {
    const current = readSnapshot();
    writeStorage(current.filter((x) => x !== id));
  }, []);

  // クライアント側で localStorage 読み込みが完了したか
  // (useSyncExternalStore は SSR 時 [] / マウント後 実データ なので、
  //  「マウント済みかどうか」の代理として typeof window で判定)
  const loaded = typeof window !== "undefined";

  return { ids, count: ids.length, isFavorite, toggle, remove, loaded };
}
