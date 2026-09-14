"use client";

import { ChevronDownIcon } from "lucide-react";

import { CheckinButton } from "@/components/checkin-button";
import { CheckinCount } from "@/components/checkin-count";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { packItemCheckinKey } from "@/lib/checkin";
import type { QaItem } from "@/lib/questions";

export function QaAccordion({ items, packUrl }: { items: QaItem[]; packUrl: string }) {
  return (
    <ol className="mt-6 divide-y rounded-xl border">
      {items.map((item, index) => {
        const checkinKey = packItemCheckinKey(packUrl, index);
        return (
          <li key={`${index}-${item.question}`}>
            <Collapsible>
              <div className="flex items-start gap-1">
                <CollapsibleTrigger className="group flex min-w-0 flex-1 items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40">
                  <span className="mt-0.5 w-7 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-foreground sm:text-base">
                    {item.question}
                    <CheckinCount checkinKey={checkinKey} />
                  </span>
                  <ChevronDownIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <div className="shrink-0 py-3 pr-3">
                  <CheckinButton checkinKey={checkinKey} />
                </div>
              </div>
              <CollapsibleContent>
                {item.answerHtml ? (
                  <div
                    className="prose prose-neutral max-w-none overflow-x-auto border-t bg-muted/20 px-4 py-4 dark:prose-invert sm:px-5"
                    dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                  />
                ) : (
                  <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                    原文没有单独的参考答案。
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </li>
        );
      })}
    </ol>
  );
}
