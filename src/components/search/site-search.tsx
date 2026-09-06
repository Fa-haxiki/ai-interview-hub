"use client";

import Fuse from "fuse.js";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DifficultyBadge } from "@/components/difficulty-badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SEARCH_INDEX_PATH, type SearchDoc } from "@/lib/search/types";

type IndexState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; fuse: Fuse<SearchDoc>; docs: SearchDoc[] }
  | { status: "error" };

const MAX_RESULTS = 20;

export function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<IndexState>({ status: "idle" });
  // 用 ref 做幂等保护，保证多次触发只请求一次；失败后允许重试
  const loadStarted = useRef(false);

  const loadIndex = useCallback(async () => {
    if (loadStarted.current) return;
    loadStarted.current = true;
    setIndex({ status: "loading" });
    try {
      const res = await fetch(SEARCH_INDEX_PATH);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const docs = (await res.json()) as SearchDoc[];
      const fuse = new Fuse(docs, {
        includeScore: true,
        ignoreLocation: true,
        threshold: 0.35,
        minMatchCharLength: 1,
        keys: [
          { name: "title", weight: 0.5 },
          { name: "tags", weight: 0.2 },
          { name: "headings", weight: 0.12 },
          { name: "summary", weight: 0.1 },
          { name: "body", weight: 0.08 },
        ],
      });
      setIndex({ status: "ready", fuse, docs });
    } catch {
      loadStarted.current = false;
      setIndex({ status: "error" });
    }
  }, []);

  const openSearch = useCallback(() => {
    setOpen(true);
    void loadIndex();
  }, [loadIndex]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // loadIndex 幂等，关闭时多调一次无副作用
        void loadIndex();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loadIndex]);

  const results = useMemo(() => {
    if (index.status !== "ready") return [];
    const q = query.trim();
    if (!q) return index.docs.slice(0, 8);
    return index.fuse
      .search(q, { limit: MAX_RESULTS })
      .map((r) => r.item);
  }, [index, query]);

  const groups = useMemo(() => {
    const map = new Map<string, SearchDoc[]>();
    for (const doc of results) {
      const key = `${doc.categoryName} · ${doc.topicName}`;
      const list = map.get(key) ?? [];
      list.push(doc);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [results]);

  const onSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    router.push(url);
  };

  return (
    <>
      <Button
        variant="outline"
        className="hidden h-9 w-56 justify-start gap-2 px-3 text-muted-foreground md:inline-flex lg:w-64"
        onClick={openSearch}
      >
        <SearchIcon className="size-4" />
        <span className="flex-1 text-left text-sm font-normal">搜索题目…</span>
        <kbd className="pointer-events-none rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        className="size-10 md:hidden"
        aria-label="搜索题目"
        onClick={openSearch}
      >
        <SearchIcon className="size-5" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
        title="搜索题目"
        description="输入关键词搜索面试题"
        className="max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none! max-sm:ring-0 sm:max-w-xl"
        showCloseButton
      >
        <Command shouldFilter={false} className="max-sm:h-dvh max-sm:rounded-none! max-sm:pt-safe">
          <CommandInput
            placeholder="搜索题目、标签、关键词…"
            value={query}
            onValueChange={setQuery}
            autoFocus
            className="text-base sm:text-sm"
          />
          <CommandList className="max-sm:max-h-[calc(100dvh-4rem)] sm:max-h-[60vh]">
            {index.status === "loading" && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                正在加载索引…
              </div>
            )}
            {index.status === "error" && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                索引加载失败，请刷新后重试。
              </div>
            )}
            {index.status === "ready" && (
              <>
                <CommandEmpty>没有找到相关题目</CommandEmpty>
                {groups.map(([heading, docs]) => (
                  <CommandGroup key={heading} heading={heading}>
                    {docs.map((doc) => (
                      <CommandItem
                        key={doc.url}
                        value={doc.url}
                        onSelect={() => onSelect(doc.url)}
                        className="min-h-11 items-start py-2"
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate font-medium">{doc.title}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {doc.section}
                            {doc.tags.length > 0 && ` · ${doc.tags.slice(0, 3).join(" / ")}`}
                          </span>
                        </div>
                        <DifficultyBadge difficulty={doc.difficulty} className="ml-2 shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
          <div className="hidden items-center justify-between border-t px-3 py-2 text-[11px] text-muted-foreground sm:flex">
            <span>↑↓ 选择 · Enter 打开 · Esc 关闭</span>
            <span>{index.status === "ready" ? `共 ${index.docs.length} 题` : ""}</span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
