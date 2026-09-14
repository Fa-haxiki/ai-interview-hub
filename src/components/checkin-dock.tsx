"use client";

import { CheckinButton } from "@/components/checkin-button";

/** 右侧浮动打卡，和大屏目录同一列；小屏贴右下角。 */
export function CheckinDock({ checkinKey }: { checkinKey: string }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto flex justify-end">
          <CheckinButton checkinKey={checkinKey} size="lg" className="h-11 px-5 shadow-lg" />
        </div>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 hidden lg:block">
        <div className="mx-auto flex max-w-6xl justify-end px-4 pb-8">
          <div className="pointer-events-auto w-[13.5rem]">
            <CheckinButton checkinKey={checkinKey} className="w-full shadow-lg" />
          </div>
        </div>
      </div>
    </>
  );
}
