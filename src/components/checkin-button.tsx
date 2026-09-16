"use client";

import { StampIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCheckin } from "@/components/checkin-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CheckinButton({
  checkinKey,
  className,
  size = "default",
}: {
  checkinKey: string;
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const { punch, countOf } = useCheckin();
  const count = countOf(checkinKey);
  const [burstId, setBurstId] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Button
      type="button"
      variant="default"
      size={size}
      className={cn("relative shrink-0 overflow-visible", className)}
      aria-label={count > 0 ? `打卡，已打卡 ${count} 次` : "打卡"}
      aria-live="polite"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        punch(checkinKey);
        setBurstId((id) => id + 1);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setBurstId(0), 700);
      }}
    >
      <StampIcon className={cn(burstId > 0 && "scale-110")} />
      {count > 0 ? (
        <>
          已打卡
          <span className="tabular-nums">{count}</span>
        </>
      ) : (
        "打卡"
      )}
      {burstId > 0 ? (
        <span
          key={burstId}
          className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums text-foreground animate-[checkin-pop_0.65s_ease-out_forwards]"
          aria-hidden
        >
          +1
        </span>
      ) : null}
    </Button>
  );
}
