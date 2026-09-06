"use client";

import { Loader2Icon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DifficultyBadge } from "@/components/difficulty-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ASSISTANT_MODELS,
  DEFAULT_ASSISTANT_MODEL,
} from "@/lib/ai-models";
import type { FollowUp } from "@/lib/questions/types";
import { SEARCH_INDEX_PATH, type SearchDoc } from "@/lib/search/types";

const MODEL_STORAGE_KEY = "assistant-model";

type RelatedHit = Pick<SearchDoc, "url" | "title" | "section" | "difficulty">;

type AskState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; answer: string; related: RelatedHit[]; model?: string }
  | { status: "error"; message: string; related: RelatedHit[] };

let docsCache: SearchDoc[] | null = null;

async function loadSearchIndex(): Promise<SearchDoc[]> {
  if (docsCache) return docsCache;
  const res = await fetch(SEARCH_INDEX_PATH);
  if (!res.ok) throw new Error(`索引加载失败 HTTP ${res.status}`);
  docsCache = (await res.json()) as SearchDoc[];
  return docsCache;
}

/** 整句中文用 Fuse 几乎搜不到，改抽英文词 + 重叠二字/三字词做包含匹配 */
function keywords(query: string): string[] {
  const latin = query.match(/[A-Za-z][A-Za-z0-9+./-]{1,}/g) ?? [];
  const chars = query.match(/[\u4e00-\u9fff]/g) ?? [];
  const grams: string[] = [];
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i <= chars.length - n; i++) {
      grams.push(chars.slice(i, i + n).join(""));
    }
  }
  return [...new Set([...latin, ...grams])];
}

function searchRelated(query: string, excludeUrl: string): RelatedHit[] {
  const docs = docsCache ?? [];
  const keys = keywords(query);
  return docs
    .filter((doc) => doc.url !== excludeUrl)
    .map((doc) => {
      const hay = `${doc.title}\n${doc.tags.join(" ")}\n${doc.section}\n${doc.summary}`;
      let score = 0;
      for (const key of keys) {
        const weight = key.length >= 3 ? 3 : /[A-Za-z]/.test(key) ? 2 : 1;
        if (doc.title.includes(key)) score += weight * 2;
        else if (hay.includes(key)) score += weight;
      }
      return { doc, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ doc }) => ({
      url: doc.url,
      title: doc.title,
      section: doc.section,
      difficulty: doc.difficulty,
    }));
}

async function askWorker(payload: {
  question: string;
  pageTitle: string;
  related: RelatedHit[];
  model: string;
}): Promise<{ answer: string; model?: string }> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    answer?: string;
    error?: string;
    model?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `助手暂不可用（${res.status}）`);
  }
  if (!data.answer?.trim()) throw new Error("模型没有返回内容");
  return { answer: data.answer.trim(), model: data.model };
}

export function FollowUpAssistant({
  followUps,
  pageTitle,
  pageUrl,
}: {
  followUps: FollowUp[];
  pageTitle: string;
  pageUrl: string;
}) {
  const [active, setActive] = useState<FollowUp | null>(null);
  const [ask, setAsk] = useState<AskState>({ status: "idle" });
  const [modelId, setModelId] = useState(DEFAULT_ASSISTANT_MODEL);

  useEffect(() => {
    void loadSearchIndex().catch(() => undefined);
    const saved = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (saved && ASSISTANT_MODELS.some((item) => item.id === saved)) {
      setModelId(saved);
    }
  }, []);

  const runAsk = useCallback(
    async (item: FollowUp) => {
      setAsk({ status: "loading" });
      try {
        await loadSearchIndex();
        const related = searchRelated(item.question, pageUrl);
        try {
          const { answer, model } = await askWorker({
            question: item.question,
            pageTitle,
            related,
            model: modelId,
          });
          setAsk({ status: "ready", answer, related, model });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "助手调用失败";
          setAsk({
            status: "error",
            message:
              message.includes("404") || message.includes("暂不可用")
                ? "当前预览环境没有接上 Cloudflare Workers AI。部署后即可生成回答；下面是站内已有的相关笔记。"
                : message,
            related,
          });
        }
      } catch {
        setAsk({
          status: "error",
          message: "搜索索引加载失败，请刷新后重试。",
          related: [],
        });
      }
    },
    [pageTitle, pageUrl, modelId],
  );

  const open = (item: FollowUp) => {
    setActive(item);
    void runAsk(item);
  };

  if (followUps.length === 0) return null;

  return (
    <section aria-labelledby="followups-heading" className="mt-10">
      <h2 id="followups-heading" className="text-lg font-semibold tracking-tight">
        可能的追问
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        点击问题会先检索本站笔记，再用你选的模型生成面试口吻短答。默认走 Cloudflare Workers AI 免费额度。
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {followUps.map((item) => (
          <li key={item.question}>
            <button
              type="button"
              onClick={() => open(item)}
              aria-label={`向助手提问：${item.question}`}
              className="flex w-full min-h-11 items-start gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-left text-sm transition-colors hover:border-foreground/20 hover:bg-muted"
            >
              <SparklesIcon className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>
                <span className="font-medium text-foreground">{item.question}</span>
                {item.hint ? (
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {item.hint}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={active !== null}
        onOpenChange={(next) => {
          if (!next) {
            setActive(null);
            setAsk({ status: "idle" });
          }
        }}
      >
        <DialogContent
          showCloseButton
          className="max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none! max-sm:ring-0 sm:max-w-xl sm:max-h-[85vh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle className="pr-8 text-base leading-snug">
              {active?.question}
            </DialogTitle>
            <DialogDescription>
              围绕「{pageTitle}」检索本站并生成回答，内容仅供练习参考。
            </DialogDescription>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              模型
              <select
                className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
                value={modelId}
                onChange={(event) => {
                  const next = event.target.value;
                  setModelId(next);
                  window.localStorage.setItem(MODEL_STORAGE_KEY, next);
                  if (active) void runAsk(active);
                }}
              >
                {ASSISTANT_MODELS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} · {item.hint}
                  </option>
                ))}
              </select>
            </label>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto pb-1">
            {ask.status === "loading" && (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                正在检索笔记并生成回答…
              </div>
            )}

            {(ask.status === "ready" || ask.status === "error") && (
              <div className="flex flex-col gap-5">
                {ask.status === "ready" && (
                  <div className="text-[15px] leading-[1.8] whitespace-pre-wrap">
                    {ask.answer}
                    {ask.model ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        由 {ask.model} 生成
                      </p>
                    ) : null}
                  </div>
                )}
                {ask.status === "error" && (
                  <p className="text-sm text-muted-foreground">{ask.message}</p>
                )}
                {ask.related.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold">本站相关笔记</h3>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {ask.related.map((doc) => (
                        <li key={doc.url}>
                          <Link
                            href={doc.url}
                            className="flex min-h-11 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                            onClick={() => setActive(null)}
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{doc.title}</span>
                              <span className="text-xs text-muted-foreground">{doc.section}</span>
                            </span>
                            <DifficultyBadge difficulty={doc.difficulty} className="shrink-0" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
