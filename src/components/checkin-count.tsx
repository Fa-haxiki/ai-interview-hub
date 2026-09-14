"use client";

import { StampIcon } from "lucide-react";

import { useCheckin } from "@/components/checkin-provider";
import { cn } from "@/lib/utils";

export function CheckinCount({
  checkinKey,
  className,
  withIcon = false,
}: {
  checkinKey: string;
  className?: string;
  withIcon?: boolean;
}) {
  const { ready, countOf } = useCheckin();
  if (!ready) return null;
  const count = countOf(checkinKey);
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap font-normal tabular-nums text-muted-foreground",
        withIcon ? "gap-1 text-xs sm:text-sm" : "ml-1.5 text-xs",
        className,
      )}
    >
      {withIcon ? <StampIcon className="size-3.5" /> : null}
      打卡 {count} 次
    </span>
  );
}
