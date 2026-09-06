import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-24">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">页面不存在</h1>
      <p className="text-muted-foreground">你访问的题目或分类可能已被移动或删除。</p>
      <Button asChild>
        <Link href="/">回到首页</Link>
      </Button>
    </div>
  );
}
