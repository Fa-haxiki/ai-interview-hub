import Link from "next/link";

import type { CategoryWithCount } from "@/lib/questions";
import { cn } from "@/lib/utils";

export function TopicSidebar({
  category,
  activeTopic,
}: {
  category: CategoryWithCount;
  activeTopic?: string;
}) {
  return (
    <aside className="hidden md:block">
      <div className="sticky top-20">
        <Link
          href={category.url}
          className="block px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase hover:text-foreground"
        >
          {category.name}
        </Link>
        <ul className="mt-2 flex flex-col gap-0.5">
          {category.topics.map((topic) => {
            const active = topic.id === activeTopic;
            return (
              <li key={topic.id}>
                <Link
                  href={topic.url}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span className="truncate">{topic.name}</span>
                  <span className="shrink-0 text-xs tabular-nums">
                    {topic.count > 0 ? topic.count : "—"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
