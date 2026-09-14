"use client";

import { useCheckin } from "@/components/checkin-provider";
import { cn } from "@/lib/utils";

export function CheckinCount({
  checkinKey,
  className,
}: {
  checkinKey: string;
  className?: string;
}) {
  const { ready, countOf } = useCheckin();
  if (!ready) return null;
  const count = countOf(checkinKey);
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "ml-1.5 inline-flex whitespace-nowrap text-xs font-normal tabular-nums text-muted-foreground",
        className,
      )}
    >
      打卡 {count} 次
    </span>
  );
}
