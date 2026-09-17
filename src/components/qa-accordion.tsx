"use client";

import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CheckinButton } from "@/components/checkin-button";
import { CheckinCount } from "@/components/checkin-count";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { packItemCheckinKey } from "@/lib/checkin";
import type { QaItem } from "@/lib/questions";

function CopyQuestionButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="mt-0.5 shrink-0 text-muted-foreground"
      aria-label={copied ? "已复制题目" : "复制题目"}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          if (timerRef.current) window.clearTimeout(timerRef.current);
          timerRef.current = window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // 非安全上下文或权限不足时静默失败
        }
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

export function QaAccordion({ items, packUrl }: { items: QaItem[]; packUrl: string }) {
  return (
    <ol className="mt-6 divide-y rounded-xl border">
      {items.map((item, index) => {
        const checkinKey = packItemCheckinKey(packUrl, index);
        return (
          <li key={`${index}-${item.question}`}>
            <Collapsible>
              <div className="flex items-start gap-1 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:gap-2">
                <CollapsibleTrigger className="group flex min-w-0 flex-1 items-start gap-3 text-left">
                  <span className="mt-0.5 w-7 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-foreground sm:text-base">
                    {item.question}
                    <CheckinCount checkinKey={checkinKey} />
                  </span>
                </CollapsibleTrigger>
                <CopyQuestionButton text={item.question} />
                <CollapsibleTrigger
                  aria-label="展开或收起题目"
                  className="group mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
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
                <div className="flex items-center justify-end border-t bg-muted/10 px-4 py-3">
                  <CheckinButton checkinKey={checkinKey} size="sm" />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </li>
        );
      })}
    </ol>
  );
}
