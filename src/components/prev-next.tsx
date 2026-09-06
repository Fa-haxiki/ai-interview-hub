import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import type { QuestionMeta } from "@/lib/questions";

function NavCard({
  question,
  direction,
}: {
  question: QuestionMeta;
  direction: "prev" | "next";
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={question.url}
      className={`group flex min-h-[4.5rem] flex-col justify-center gap-1 rounded-xl border p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40 ${
        isNext ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {!isNext && <ArrowLeftIcon className="size-3.5" />}
        {isNext ? "下一题" : "上一题"}
        {isNext && <ArrowRightIcon className="size-3.5" />}
      </span>
      <span className="text-sm font-medium leading-snug group-hover:text-brand">
        {question.title}
      </span>
    </Link>
  );
}

export function PrevNext({
  prev,
  next,
}: {
  prev: QuestionMeta | null;
  next: QuestionMeta | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="上一题 / 下一题" className="mt-10 grid gap-3 sm:grid-cols-2">
      {prev ? <NavCard question={prev} direction="prev" /> : <div className="hidden sm:block" />}
      {next && <NavCard question={next} direction="next" />}
    </nav>
  );
}
