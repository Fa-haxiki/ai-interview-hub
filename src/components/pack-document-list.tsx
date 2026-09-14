import Link from "next/link";

import type { QuestionMeta } from "@/lib/questions";

export function PackDocumentList({ documents }: { documents: QuestionMeta[] }) {
  const groups = new Map<string, QuestionMeta[]>();
  for (const doc of documents) {
    const list = groups.get(doc.section) ?? [];
    list.push(doc);
    groups.set(doc.section, list);
  }

  const sections = [...groups.entries()].sort(([a], [b]) => {
    const yearA = Number(a);
    const yearB = Number(b);
    if (Number.isFinite(yearA) && Number.isFinite(yearB)) return yearB - yearA;
    if (Number.isFinite(yearA)) return -1;
    if (Number.isFinite(yearB)) return 1;
    return a.localeCompare(b, "zh-Hans");
  });

  return (
    <div className="mt-6 flex flex-col gap-10">
      {sections.map(([section, items]) => (
        <section key={section} aria-labelledby={`year-${section}`}>
          <h2
            id={`year-${section}`}
            className="flex items-baseline gap-2 border-b pb-2 text-base font-semibold sm:text-lg"
          >
            {section}
            <span className="text-xs font-normal text-muted-foreground">
              {items.length} 份
            </span>
          </h2>
          <ul className="mt-2 flex flex-col divide-y">
            {items.map((doc) => (
              <li key={doc.url}>
                <Link
                  href={doc.url}
                  className="group -mx-2 flex items-start justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50 sm:-mx-3 sm:px-3"
                >
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-medium leading-snug text-foreground group-hover:text-brand sm:text-base">
                      {doc.title}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                    {doc.qaCount} 题
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
