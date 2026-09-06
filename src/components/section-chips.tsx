import type { SectionGroup } from "@/lib/questions";

/** 小节快速跳转：手机端横向滚动，桌面端自动换行 */
export function SectionChips({ sections }: { sections: SectionGroup[] }) {
  if (sections.length <= 1) return null;

  return (
    <nav aria-label="小节导航" className="-mx-4 px-4 md:mx-0 md:px-0">
      <ul className="flex snap-x gap-2 overflow-x-auto pb-1 scrollbar-none md:flex-wrap md:overflow-visible">
        {sections.map((group) => (
          <li key={group.anchor} className="snap-start">
            <a
              href={`#${group.anchor}`}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border bg-background px-3.5 text-sm text-foreground/85 transition-colors hover:border-foreground/25 hover:bg-muted"
            >
              {group.section}
              <span className="text-xs text-muted-foreground">{group.questions.length}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
