"use client";

import { ChevronDownIcon, ListIcon } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { TocItem } from "@/lib/questions/types";
import { cn } from "@/lib/utils";

function useActiveHeading(items: TocItem[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] },
    );
    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return activeId;
}

function TocLinks({
  items,
  activeId,
  onNavigate,
}: {
  items: TocItem[];
  activeId: string | null;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5 text-sm">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={onNavigate}
            className={cn(
              "block rounded-md py-1.5 leading-snug transition-colors hover:text-foreground",
              item.depth === 3 ? "pl-5 pr-2" : "px-2",
              activeId === item.id ? "font-medium text-brand" : "text-muted-foreground",
            )}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** 桌面端右侧粘性目录 */
export function Toc({ items }: { items: TocItem[] }) {
  const activeId = useActiveHeading(items);
  if (items.length === 0) return null;

  return (
    <nav aria-label="目录" className="text-sm">
      <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        目录
      </p>
      <TocLinks items={items} activeId={activeId} />
    </nav>
  );
}

/** 手机 / 平板端正文顶部的可折叠目录 */
export function TocCollapsible({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-muted/30">
      <CollapsibleTrigger className="flex min-h-11 w-full items-center gap-2 px-3 text-sm font-medium">
        <ListIcon className="size-4 text-muted-foreground" />
        目录
        <span className="text-xs font-normal text-muted-foreground">{items.length} 节</span>
        <ChevronDownIcon
          className={cn(
            "ml-auto size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-2 py-2">
        <TocLinks items={items} activeId={null} onNavigate={() => setOpen(false)} />
      </CollapsibleContent>
    </Collapsible>
  );
}
