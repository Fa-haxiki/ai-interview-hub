import { ExternalLinkIcon } from "lucide-react";

import type { QuestionSource } from "@/lib/questions";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SourceList({ sources }: { sources: QuestionSource[] }) {
  if (sources.length === 0) return null;

  return (
    <section aria-labelledby="sources-heading" className="mt-10 rounded-xl border bg-muted/30 p-4 sm:p-5">
      <h2 id="sources-heading" className="text-sm font-semibold">
        参考来源
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        答案基于以下资料整理并用面试者口吻重写；标记为「英文」的来源已翻译整理。
      </p>
      <ol className="mt-3 flex flex-col gap-2.5">
        {sources.map((source, index) => (
          <li key={source.url} className="flex gap-2 text-sm">
            <span className="w-4 shrink-0 text-right text-xs leading-6 text-muted-foreground tabular-nums">
              {index + 1}.
            </span>
            <div className="min-w-0 flex-1">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-start gap-1 font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                <span className="break-words">{source.title}</span>
                <ExternalLinkIcon className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
              </a>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span className="break-all">{hostOf(source.url)}</span>
                <span
                  className={
                    source.lang === "en"
                      ? "rounded border border-brand/30 bg-brand/10 px-1.5 py-px text-xs text-brand"
                      : "rounded border px-1.5 py-px text-xs"
                  }
                >
                  {source.lang === "en" ? "英文 · 已翻译整理" : "中文"}
                </span>
                {source.note && <span>{source.note}</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
