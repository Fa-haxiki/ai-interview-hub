"use client";

import { StampIcon } from "lucide-react";

import { useCheckin } from "@/components/checkin-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CheckinButton({
  checkinKey,
  className,
}: {
  checkinKey: string;
  className?: string;
}) {
  const { punch, countOf } = useCheckin();
  const count = countOf(checkinKey);

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      className={cn("shrink-0", className)}
      aria-label={count > 0 ? `打卡，已打卡 ${count} 次` : "打卡"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        punch(checkinKey);
      }}
    >
      <StampIcon />
      打卡
    </Button>
  );
}
