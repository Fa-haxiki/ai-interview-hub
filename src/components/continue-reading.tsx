"use client";

import { BookOpenIcon } from "lucide-react";
import Link from "next/link";

import { useProgress } from "@/lib/progress";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export function ContinueReading() {
  const { progress, loading } = useProgress();

  if (loading || !progress) return null;

  return (
    <section aria-labelledby="continue-heading" className="mt-6 max-w-2xl">
      <Link
        href={progress.path}
        className="group block rounded-xl border bg-card p-4 transition-colors hover:border-brand/40 hover:bg-muted/30"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-brand">
          <BookOpenIcon className="size-3.5" />
          <h2 id="continue-heading">继续阅读</h2>
        </div>
        <h3 className="mt-2 text-base font-medium leading-snug text-foreground group-hover:text-brand sm:text-lg">
          {progress.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {progress.section && <span>{progress.section}</span>}
          {progress.updatedAt && (
            <>
              <span aria-hidden>·</span>
              <span>{relativeTime(progress.updatedAt)}</span>
            </>
          )}
          {progress.scrollRatio > 0.02 && (
            <>
              <span aria-hidden>·</span>
              <span>已读 {Math.round(progress.scrollRatio * 100)}%</span>
            </>
          )}
        </div>
      </Link>
    </section>
  );
}
