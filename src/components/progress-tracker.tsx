"use client";

import { useProgressTracker } from "@/lib/progress";

type Props = {
  question: {
    category: string;
    topic: string;
    slug: string;
    title: string;
    section: string;
    path: string;
  };
};

/** 题目页隐形组件：记录滚动进度，并在回到同一题时恢复滚动位置。 */
export function ProgressTracker({ question }: Props) {
  useProgressTracker(question);
  return null;
}
