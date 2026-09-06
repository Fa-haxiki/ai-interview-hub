import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import type { CategoryWithCount } from "@/lib/questions";
import { cn } from "@/lib/utils";

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  const ready = category.count > 0;

  return (
    <Link
      href={category.url}
      className={cn(
        "group flex flex-col rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{category.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            ready ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {ready ? `${category.count} 题` : "筹备中"}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-1.5 text-sm">
        {category.topics.slice(0, 4).map((topic) => (
          <li key={topic.id} className="flex items-center justify-between gap-3">
            <span className={topic.count > 0 ? "text-foreground/90" : "text-muted-foreground"}>
              {topic.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {topic.count > 0 ? topic.count : "—"}
            </span>
          </li>
        ))}
      </ul>

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
        进入分类
        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
